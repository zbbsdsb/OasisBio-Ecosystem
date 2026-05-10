package com.oasisbio.app.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class OasisBio(
    val id: String,
    val title: String,
    val slug: String,
    val tagline: String,
    val summary: String,
    val identityMode: String,
    val createdAt: String,
    val updatedAt: String
)

enum class IdentityMode(val displayName: String) {
    REAL("real"),
    FICTIONAL("fictional"),
    HYBRID("hybrid"),
    FUTURE("future"),
    ALTERNATE("alternate");

    companion object {
        fun fromString(value: String): IdentityMode = values().firstOrNull {
            it.displayName.equals(value, ignoreCase = true)
        } ?: REAL
    }
}