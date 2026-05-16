package com.oasisbio.app.data.repository

import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.domain.repository.DeveloperAppsRepository
import com.oasisbio.app.presentation.ui.screens.OAuthApp
import com.oasisbio.app.presentation.ui.screens.OAuthAppRegistration
import timber.log.Timber
import javax.inject.Inject

class DeveloperAppsRepositoryImpl @Inject constructor(
    private val oasisBioApi: OasisBioApi
) : DeveloperAppsRepository {

    override suspend fun getApps(): Result<List<OAuthApp>> {
        return try {
            val response = oasisBioApi.getOAuthApps()
            if (response.isSuccessful) {
                Result.success(response.body() ?: emptyList())
            } else {
                val exception = createApiException(response.code(), "Failed to get OAuth apps")
                Timber.e("Failed to get OAuth apps: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting OAuth apps")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun getAppById(id: String): Result<OAuthApp> {
        return try {
            val response = oasisBioApi.getOAuthAppById(id)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it)
                } ?: Result.failure(ApiException.NotFound("OAuth app not found"))
            } else {
                val exception = createApiException(response.code(), "Failed to get OAuth app")
                Timber.e("Failed to get OAuth app: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting OAuth app by id: $id")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun createApp(registration: OAuthAppRegistration): Result<OAuthApp> {
        return try {
            val response = oasisBioApi.createOAuthApp(registration)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it)
                } ?: Result.failure(ApiException.ServerError("Failed to create OAuth app"))
            } else {
                val exception = createApiException(response.code(), "Failed to create OAuth app")
                Timber.e("Failed to create OAuth app: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error creating OAuth app")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun updateApp(app: OAuthApp): Result<OAuthApp> {
        return try {
            val response = oasisBioApi.updateOAuthApp(app.id, app)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it)
                } ?: Result.failure(ApiException.ServerError("Failed to update OAuth app"))
            } else {
                val exception = createApiException(response.code(), "Failed to update OAuth app")
                Timber.e("Failed to update OAuth app: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error updating OAuth app: ${app.id}")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun deleteApp(id: String): Result<Unit> {
        return try {
            val response = oasisBioApi.deleteOAuthApp(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val exception = createApiException(response.code(), "Failed to delete OAuth app")
                Timber.e("Failed to delete OAuth app: ${response.code()}")
                Result.failure(exception)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error deleting OAuth app: $id")
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
