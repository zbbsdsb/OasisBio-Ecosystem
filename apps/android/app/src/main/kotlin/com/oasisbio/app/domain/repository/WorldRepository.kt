package com.oasisbio.app.domain.repository

import com.oasisbio.app.domain.model.World

interface WorldRepository {
    suspend fun getWorlds(): Result<List<World>>
    suspend fun getWorld(id: String): Result<World>
    suspend fun createWorld(world: World): Result<World>
    suspend fun updateWorld(id: String, world: World): Result<World>
    suspend fun deleteWorld(id: String): Result<Unit>
}
