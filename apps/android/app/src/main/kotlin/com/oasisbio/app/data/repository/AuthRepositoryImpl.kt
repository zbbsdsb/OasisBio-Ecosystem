package com.oasisbio.app.data.repository

import com.oasisbio.app.data.local.AuthDataStore
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.domain.model.UserProfile
import com.oasisbio.app.domain.repository.AuthRepository
import io.github.jan_tennert.supabase.SupabaseClient
import io.github.jan_tennert.supabase.auth.Auth
import io.github.jan_tennert.supabase.auth.auth
import io.github.jan_tennert.supabase.auth.providers.builtin.Email
import io.github.jan_tennert.supabase.auth.signInWith
import kotlinx.coroutines.flow.Flow
import timber.log.Timber
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val authDataStore: AuthDataStore,
    private val oasisBioApi: OasisBioApi
) : AuthRepository {

    private val auth: Auth = supabaseClient.auth

    override val currentUser: Flow<UserProfile?> = authDataStore.currentUser

    override suspend fun signInWithOtp(email: String) {
        try {
            auth.signInWith(Email) {
                this.email = email
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to send OTP")
            throw e
        }
    }

    override suspend fun verifyOtp(email: String, otp: String) {
        try {
            val session = auth.verifyOTP(
                email = email,
                token = otp,
                type = io.github.jan_tennert.supabase.auth.OtpType.SIGN_IN
            )
            
            session.accessToken?.let { accessToken ->
                session.refreshToken?.let { refreshToken ->
                    authDataStore.saveTokens(accessToken, refreshToken)
                }
            }

            val profile = getProfile()
            authDataStore.saveUserProfile(profile)
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to verify OTP")
            throw e
        }
    }

    override suspend fun signOut() {
        try {
            auth.signOut()
            authDataStore.clearAll()
        } catch (e: Exception) {
            Timber.e(e, "Failed to sign out")
            throw e
        }
    }

    override suspend fun getProfile(): UserProfile {
        return try {
            val response = oasisBioApi.getProfile()
            if (response.isSuccessful) {
                response.body() ?: throw Exception("Profile response is null")
            } else {
                throw Exception("Failed to get profile: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to get profile")
            throw e
        }
    }
}