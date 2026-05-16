package com.oasisbio.app.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Session(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val expiresAt: Long,
    val tokenType: String,
    val userId: String
)
