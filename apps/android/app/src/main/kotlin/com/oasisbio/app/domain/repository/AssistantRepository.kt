package com.oasisbio.app.domain.repository

import com.oasisbio.app.domain.model.ChatMessage
import com.oasisbio.app.domain.model.ChatSession

interface AssistantRepository {
    suspend fun getSessions(): Result<List<ChatSession>>
    suspend fun createSession(title: String? = null): Result<ChatSession>
    suspend fun getSession(sessionId: String): Result<ChatSession>
    suspend fun deleteSession(sessionId: String): Result<Unit>
    suspend fun getMessages(sessionId: String): Result<List<ChatMessage>>
    suspend fun sendMessage(sessionId: String, content: String, assistantType: AssistantType): Result<ChatMessage>
}

enum class AssistantType(val displayName: String) {
    DEO("Deo"),
    DIA("Dia")
}
