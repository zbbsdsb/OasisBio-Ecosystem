package com.oasisbio.app.domain.usecase.auth

import com.oasisbio.app.domain.model.Session
import com.oasisbio.app.domain.repository.AuthRepository
import javax.inject.Inject

class VerifyOtpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, otp: String): Result<Session> {
        return authRepository.verifyOtp(email, otp)
    }
}