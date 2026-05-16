package com.oasisbio.app.domain.repository

import com.oasisbio.app.domain.model.OasisBio

interface IdentityRepository {
    suspend fun getAllIdentities(): Result<List<OasisBio>>
    suspend fun getIdentityById(id: String): Result<OasisBio>
    suspend fun createIdentity(identity: OasisBio): Result<OasisBio>
    suspend fun updateIdentity(id: String, identity: OasisBio): Result<OasisBio>
    suspend fun deleteIdentity(id: String): Result<Unit>
}