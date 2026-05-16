package com.oasisbio.app.data.repository

import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.domain.model.World
import com.oasisbio.app.domain.repository.WorldRepository
import timber.log.Timber
import javax.inject.Inject

class WorldRepositoryImpl @Inject constructor(
    private val oasisBioApi: OasisBioApi
) : WorldRepository {

    override suspend fun getWorlds(): Result<List<World>> {
        return try {
            val response = oasisBioApi.getAllWorlds()
            if (response.isSuccessful) {
                Result.success(response.body()?.map { it.toWorld() } ?: emptyList())
            } else {
                Result.failure(createApiException(response.code(), "Failed to get worlds"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting worlds")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun getWorld(id: String): Result<World> {
        return try {
            val response = oasisBioApi.getWorldById(id)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it.toWorld())
                } ?: Result.failure(ApiException.NotFound("World not found"))
            } else {
                Result.failure(createApiException(response.code(), "Failed to get world"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting world: $id")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun createWorld(world: World): Result<World> {
        return try {
            val settingMap = buildMap<String, Any> {
                put("genre", world.setting.genre)
                put("tone", world.setting.tone)
                put("themes", world.setting.themes)
                put("characters", world.setting.characters.map {
                    mapOf("name" to it.name, "role" to it.role, "description" to it.description)
                })
                put("locations", world.setting.locations.map {
                    mapOf("name" to it.name, "type" to it.type, "description" to it.description)
                })
                put("rules", mapOf(
                    "magicSystem" to world.setting.rules.magicSystem,
                    "technologyLevel" to world.setting.rules.technologyLevel,
                    "socialStructure" to world.setting.rules.socialStructure,
                    "economy" to world.setting.rules.economy,
                    "politics" to world.setting.rules.politics
                ))
                put("lore", world.setting.lore.map {
                    mapOf("title" to it.title, "content" to it.content, "category" to it.category)
                })
            }
            val response = oasisBioApi.createWorld(
                CreateWorldRequest(
                    name = world.name,
                    description = world.description,
                    setting = settingMap
                )
            )
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it.toWorld())
                } ?: Result.failure(ApiException.ServerError("Failed to create world"))
            } else {
                Result.failure(createApiException(response.code(), "Failed to create world"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error creating world")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun updateWorld(id: String, world: World): Result<World> {
        return try {
            val settingMap = buildMap<String, Any> {
                put("genre", world.setting.genre)
                put("tone", world.setting.tone)
            }
            val response = oasisBioApi.updateWorld(
                id,
                UpdateWorldRequest(
                    name = world.name,
                    description = world.description,
                    setting = settingMap
                )
            )
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it.toWorld())
                } ?: Result.failure(ApiException.ServerError("Failed to update world"))
            } else {
                Result.failure(createApiException(response.code(), "Failed to update world"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error updating world: $id")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun deleteWorld(id: String): Result<Unit> {
        return try {
            val response = oasisBioApi.deleteWorld(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(createApiException(response.code(), "Failed to delete world"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error deleting world: $id")
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

    private fun com.oasisbio.app.data.remote.WorldResponse.toWorld(): World {
        return World(
            id = id,
            name = name,
            description = description,
            setting = com.oasisbio.app.domain.model.WorldSetting(
                genre = (setting?.get("genre") as? String) ?: "",
                tone = (setting?.get("tone") as? String) ?: ""
            ),
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}
