package com.oasisbio.app.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class World(
    val id: String,
    val name: String,
    val description: String,
    val setting: WorldSetting,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class WorldSetting(
    val genre: String = "",
    val tone: String = "",
    val themes: List<String> = emptyList(),
    val characters: List<WorldCharacter> = emptyList(),
    val locations: List<WorldLocation> = emptyList(),
    val lore: List<WorldLore> = emptyList(),
    val rules: WorldRules = WorldRules()
)

@Serializable
data class WorldCharacter(
    val name: String,
    val role: String,
    val description: String
)

@Serializable
data class WorldLocation(
    val name: String,
    val type: String,
    val description: String
)

@Serializable
data class WorldLore(
    val title: String,
    val content: String,
    val category: String
)

@Serializable
data class WorldRules(
    val magicSystem: String = "",
    val technologyLevel: String = "",
    val socialStructure: String = "",
    val economy: String = "",
    val politics: String = ""
)

@Serializable
data class WorldWizardState(
    val step1Name: String = "",
    val step1Description: String = "",
    val step2Genre: String = "",
    val step2Tone: String = "",
    val step3Themes: List<String> = emptyList(),
    val step4Characters: List<WorldCharacter> = emptyList(),
    val step5Locations: List<WorldLocation> = emptyList(),
    val step6Rules: WorldRules = WorldRules(),
    val step6Lore: List<WorldLore> = emptyList()
)
