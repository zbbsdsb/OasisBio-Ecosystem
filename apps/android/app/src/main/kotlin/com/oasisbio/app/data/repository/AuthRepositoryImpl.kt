package com.oasisbio.app.data.repository

import com.oasisbio.app.data.local.AuthDataStore
import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.data.remote.SignInRequest
import com.oasisbio.app.data.remote.VerifyOtpRequest
import com.oasisbio.app.domain.model.Session
import com.oasisbio.app.domain.model.UserProfile
import com.oasisbio.app.domain.repository.AuthRepository
import io.github.jan_tennert.supabase.SupabaseClient
import io.github.jan_tennert.supabase.auth.Auth
import io.github.jan_tennert.supabase.auth.auth
import io.github.jan_tennert.supabase.auth.providers.builtin.Email
import io.github.jan_tennert.supabase.auth.providers.otp.OTPConfig
import io.github.jan_tennert.supabase.auth.signInWith
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import timber.log.Timber
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val authDataStore: AuthDataStore,
    private val oasisBioApi: OasisBioApi
) : AuthRepository {

    private val auth: Auth = supabaseClient.auth

    override val currentUser: Flow<UserProfile?> = authDataStore.currentUser

    override suspend fun sendOtp(email: String): Result<Unit> {
        return try {
            auth.signInWith<Email>(OTPConfig {
                email = email
                createUser = false
            })
            Timber.d("OTP sent successfully to $email")
            Result.success(Unit)
        } catch (e: Exception) {
            Timber.e(e, "Failed to send OTP to $email")
            Result.failure(mapToApiException(e))
        }
    }

    override suspend fun verifyOtp(email: String, otp: String): Result<Session> {
        return try {
            val response = oasisBioApi.verifyOtp(
                VerifyOtpRequest(email = email, otp = otp)
            )

            if (response.isSuccessful) {
                val authResponse = response.body()!!
                val session = Session(
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken,
                    expiresIn = authResponse.expiresIn,
                    expiresAt = System.currentTimeMillis() / 1000 + authResponse.expiresIn,
                    tokenType = authResponse.tokenType,
                    userId = authResponse.user.id
                )

                authDataStore.saveSession(session)
                authDataStore.saveUserProfile(authResponse.user)

                Timber.d("OTP verified successfully for $email")
                Result.success(session)
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid OTP code"
                    401 -> "OTP expired or invalid"
                    else -> "Verification failed: ${response.code()}"
                }
                Timber.e("OTP verification failed: ${response.code()}")
                Result.failure(ApiException.BadRequest(errorMessage))
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to verify OTP for $email")
            Result.failure(mapToApiException(e))
        }
    }

    override suspend fun signOut(): Result<Unit> {
        return try {
            auth.signOut()
            authDataStore.clearAll()
            Timber.d("User signed out successfully")
            Result.success(Unit)
        } catch (e: Exception) {
            Timber.e(e, "Failed to sign out")
            authDataStore.clearAll()
            Result.failure(mapToApiException(e))
        }
    }

    override suspend fun getProfile(): Result<UserProfile> {
        return try {
            val response = oasisBioApi.getProfile()
            if (response.isSuccessful) {
                val profile = response.body()!!
                authDataStore.saveUserProfile(profile)
                Result.success(profile)
            } else {
                Result.failure(mapHttpError(response.code(), "Failed to get profile"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to get profile")
            Result.failure(mapToApiException(e))
        }
    }

    override suspend fun refreshToken(): Result<Session> {
        return try {
            val refreshToken = authDataStore.getRefreshToken()
                ?: return Result.failure(ApiException.Unauthorized("No refresh token available"))

            val response = oasisBioApi.refreshToken(
                com.oasisbio.app.data.remote.RefreshTokenRequest(refreshToken)
            )

            if (response.isSuccessful) {
                val authResponse = response.body()!!
                val session = Session(
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken,
                    expiresIn = authResponse.expiresIn,
                    expiresAt = System.currentTimeMillis() / 1000 + authResponse.expiresIn,
                    tokenType = authResponse.tokenType,
                    userId = authResponse.user.id
                )

                authDataStore.updateTokens(
                    authResponse.accessToken,
                    authResponse.refreshToken,
                    authResponse.expiresIn
                )

                Timber.d("Token refreshed successfully")
                Result.success(session)
            } else {
                Result.failure(mapHttpError(response.code(), "Failed to refresh token"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to refresh token")
            Result.failure(mapToApiException(e))
        }
    }

    override suspend fun getCurrentSession(): Result<Session> {
        return try {
            val session = authDataStore.getSession()
            if (session != null) {
                Result.success(session)
            } else {
                Result.failure(ApiException.Unauthorized("No active session"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to get current session")
            Result.failure(mapToApiException(e))
        }
    }

    override suspend fun isLoggedIn(): Boolean {
        return try {
            val session = authDataStore.getSession()
            val isLoggedIn = session != null && session.expiresAt > System.currentTimeMillis() / 1000
            Timber.d("User logged in status: $isLoggedIn")
            isLoggedIn
        } catch (e: Exception) {
            Timber.e(e, "Failed to check login status")
            false
        }
    }

    private fun mapToApiException(e: Exception): ApiException {
        return when (e) {
            is ApiException -> e
            is java.net.UnknownHostException,
            is java.net.SocketTimeoutException,
            is java.net.ConnectException -> ApiException.NetworkError("Network connection failed")
            is retrofit2.HttpException -> mapHttpError(e.code(), e.message())
            else -> ApiException.UnknownError(e.message ?: "Unknown error occurred")
        }
    }

    private fun mapHttpError(code: Int, message: String): ApiException {
        return when (code) {
            401 -> ApiException.Unauthorized(message)
            403 -> ApiException.Forbidden(message)
            404 -> ApiException.NotFound(message)
            in 400..499 -> ApiException.BadRequest(message)
            in 500..599 -> ApiException.ServerError(message, code)
            else -> ApiException.UnknownError(message)
        }
    }
}