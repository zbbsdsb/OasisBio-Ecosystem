package com.oasisbio.app.domain.usecase.identity

import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.repository.IdentityRepository
import javax.inject.Inject

class CreateIdentityUseCase @Inject constructor(
    private val identityRepository: IdentityRepository
) {
    suspend operator fun invoke(identity: OasisBio): OasisBio {
        return identityRepository.createIdentity(identity)
    }
}