package com.oasisbio.app.domain.repository

import com.oasisbio.app.domain.model.OasisBio

interface IdentityRepository {
    suspend fun getAllIdentities(): List<OasisBio>
    suspend fun getIdentityById(id: String): OasisBio
    suspend fun createIdentity(identity: OasisBio): OasisBio
    suspend fun updateIdentity(id: String, identity: OasisBio): OasisBio
    suspend fun deleteIdentity(id: String)
}