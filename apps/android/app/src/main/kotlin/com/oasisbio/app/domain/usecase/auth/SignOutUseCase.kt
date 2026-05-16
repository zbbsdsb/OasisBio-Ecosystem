package com.oasisbio.app.domain.usecase.auth

import com.oasisbio.app.domain.repository.AuthRepository
import javax.inject.Inject

class SignOutUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): Result<Unit> {
        return authRepository.signOut()
    }
}