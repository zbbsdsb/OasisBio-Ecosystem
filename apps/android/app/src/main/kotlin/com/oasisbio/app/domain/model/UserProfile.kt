package com.oasisbio.app.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: String,
    val email: String,
    val displayName: String?,
    val avatarUrl: String?
)