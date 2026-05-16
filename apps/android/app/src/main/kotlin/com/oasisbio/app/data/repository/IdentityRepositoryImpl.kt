package com.oasisbio.app.data.repository

import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.data.remote.CreateIdentityRequest
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.data.remote.UpdateIdentityRequest
import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.repository.IdentityRepository
import timber.log.Timber
import javax.inject.Inject

class IdentityRepositoryImpl @Inject constructor(
    private val oasisBioApi: OasisBioApi
) : IdentityRepository {

    override suspend fun getAllIdentities(): Result<List<OasisBio>> {
        return try {
            val response = oasisBioApi.getAllIdentities()
            if (response.isSuccessful) {
                Result.success(response.body() ?: emptyList())
            } else {
                val exception = createApiException(response.code(), "Failed to get identities")
                Timber.e("Failed to get identities: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting identities")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun getIdentityById(id: String): Result<OasisBio> {
        return try {
            val response = oasisBioApi.getIdentityById(id)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it)
                } ?: Result.failure(ApiException.NotFound("Identity not found"))
            } else {
                val exception = createApiException(response.code(), "Failed to get identity")
                Timber.e("Failed to get identity: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting identity by id: $id")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun createIdentity(identity: OasisBio): Result<OasisBio> {
        return try {
            val request = CreateIdentityRequest(
                title = identity.title,
                slug = identity.slug,
                tagline = identity.tagline,
                summary = identity.summary,
                identityMode = identity.identityMode
            )
            val response = oasisBioApi.createIdentity(request)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it)
                } ?: Result.failure(ApiException.ServerError("Failed to create identity"))
            } else {
                val exception = createApiException(response.code(), "Failed to create identity")
                Timber.e("Failed to create identity: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error creating identity")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun updateIdentity(id: String, identity: OasisBio): Result<OasisBio> {
        return try {
            val request = UpdateIdentityRequest(
                title = identity.title,
                slug = identity.slug,
                tagline = identity.tagline,
                summary = identity.summary,
                identityMode = identity.identityMode
            )
            val response = oasisBioApi.updateIdentity(id, request)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it)
                } ?: Result.failure(ApiException.ServerError("Failed to update identity"))
            } else {
                val exception = createApiException(response.code(), "Failed to update identity")
                Timber.e("Failed to update identity: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error updating identity: $id")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun deleteIdentity(id: String): Result<Unit> {
        return try {
            val response = oasisBioApi.deleteIdentity(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val exception = createApiException(response.code(), "Failed to delete identity")
                Timber.e("Failed to delete identity: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error deleting identity: $id")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    private fun createApiException(code: Int, defaultMessage: String): ApiException {
        return when (code) {
            401 -> ApiException.Unauthorized()
            403 -> ApiException.Forbidden()
            404 -> ApiException.NotFound()
            in 400..499 -> ApiException.BadRequest(defaultMessage)
            in 500..599 -> ApiException.ServerError(defaultMessage, code)
            else -> ApiException.UnknownError(defaultMessage)
        }
    }
}