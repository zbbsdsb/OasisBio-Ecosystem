package com.oasisbio.app.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Ability(
    val id: String,
    val oasisBioId: String,
    val name: String,
    val category: String,
    val sourceType: String,
    val level: Int,
    val description: String?,
    val relatedWorldId: String?,
    val relatedEraId: String?,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class AbilityListState(
    val abilities: List<Ability> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val operationInProgress: Boolean = false
)
