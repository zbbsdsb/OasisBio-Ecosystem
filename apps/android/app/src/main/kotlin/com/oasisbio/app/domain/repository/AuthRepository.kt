package com.oasisbio.app.domain.repository

import com.oasisbio.app.domain.model.UserProfile
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val currentUser: Flow<UserProfile?>
    suspend fun signInWithOtp(email: String)
    suspend fun verifyOtp(email: String, otp: String)
    suspend fun signOut()
    suspend fun getProfile(): UserProfile
}