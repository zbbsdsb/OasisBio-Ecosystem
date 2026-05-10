package com.oasisbio.app.domain.usecase.auth

import com.oasisbio.app.domain.repository.AuthRepository
import javax.inject.Inject

class VerifyOtpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, otp: String) {
        authRepository.verifyOtp(email, otp)
    }
}