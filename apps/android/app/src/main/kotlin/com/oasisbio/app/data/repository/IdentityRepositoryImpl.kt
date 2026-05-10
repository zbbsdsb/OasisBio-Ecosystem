package com.oasisbio.app.data.repository

import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.repository.IdentityRepository
import timber.log.Timber
import javax.inject.Inject

class IdentityRepositoryImpl @Inject constructor(
    private val oasisBioApi: OasisBioApi
) : IdentityRepository {

    override suspend fun getAllIdentities(): List<OasisBio> {
        return try {
            val response = oasisBioApi.getAllIdentities()
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                Timber.e("Failed to get identities: ${response.code()}")
                emptyList()
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting identities")
            emptyList()
        }
    }

    override suspend fun getIdentityById(id: String): OasisBio {
        return try {
            val response = oasisBioApi.getIdentityById(id)
            if (response.isSuccessful) {
                response.body() ?: throw Exception("Identity not found")
            } else {
                throw Exception("Failed to get identity: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting identity by id: $id")
            throw e
        }
    }

    override suspend fun createIdentity(identity: OasisBio): OasisBio {
        return try {
            val response = oasisBioApi.createIdentity(identity)
            if (response.isSuccessful) {
                response.body() ?: throw Exception("Failed to create identity")
            } else {
                throw Exception("Failed to create identity: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error creating identity")
            throw e
        }
    }

    override suspend fun updateIdentity(id: String, identity: OasisBio): OasisBio {
        return try {
            val response = oasisBioApi.updateIdentity(id, identity)
            if (response.isSuccessful) {
                response.body() ?: throw Exception("Failed to update identity")
            } else {
                throw Exception("Failed to update identity: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error updating identity: $id")
            throw e
        }
    }

    override suspend fun deleteIdentity(id: String) {
        try {
            val response = oasisBioApi.deleteIdentity(id)
            if (!response.isSuccessful) {
                throw Exception("Failed to delete identity: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error deleting identity: $id")
            throw e
        }
    }
}