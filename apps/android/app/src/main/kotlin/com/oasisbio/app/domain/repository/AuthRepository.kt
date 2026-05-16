package com.oasisbio.app.domain.repository

import com.oasisbio.app.domain.model.Session
import com.oasisbio.app.domain.model.UserProfile
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val currentUser: Flow<UserProfile?>

    suspend fun sendOtp(email: String): Result<Unit>
    suspend fun verifyOtp(email: String, otp: String): Result<Session>
    suspend fun signOut(): Result<Unit>
    suspend fun getProfile(): Result<UserProfile>
    suspend fun refreshToken(): Result<Session>
    suspend fun getCurrentSession(): Result<Session>
    suspend fun isLoggedIn(): Boolean
}
