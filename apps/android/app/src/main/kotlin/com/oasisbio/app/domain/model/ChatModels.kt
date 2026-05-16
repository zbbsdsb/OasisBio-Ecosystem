package com.oasisbio.app.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ChatSession(
    val id: String,
    val title: String?,
    val assistantType: String,
    val lastMessage: String?,
    val messageCount: Int = 0,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class ChatMessage(
    val id: String,
    val sessionId: String,
    val content: String,
    val role: MessageRole,
    val assistantType: String? = null,
    val createdAt: String
)

@Serializable
enum class MessageRole {
    USER,
    ASSISTANT,
    SYSTEM
}
