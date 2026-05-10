package com.oasisbio.app.domain.usecase.identity

import com.oasisbio.app.domain.repository.IdentityRepository
import javax.inject.Inject

class DeleteIdentityUseCase @Inject constructor(
    private val identityRepository: IdentityRepository
) {
    suspend operator fun invoke(id: String) {
        identityRepository.deleteIdentity(id)
    }
}