package com.oasisbio.app.domain.usecase.identity

import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.repository.IdentityRepository
import javax.inject.Inject

class UpdateIdentityUseCase @Inject constructor(
    private val identityRepository: IdentityRepository
) {
    suspend operator fun invoke(id: String, identity: OasisBio): OasisBio {
        return identityRepository.updateIdentity(id, identity)
    }
}