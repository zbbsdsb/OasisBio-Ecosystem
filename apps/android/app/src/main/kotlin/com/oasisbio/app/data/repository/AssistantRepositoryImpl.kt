package com.oasisbio.app.data.repository

import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.data.remote.ChatMessageResponse
import com.oasisbio.app.data.remote.ChatSessionResponse
import com.oasisbio.app.data.remote.CreateChatSessionRequest
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.data.remote.SendChatMessageRequest
import com.oasisbio.app.domain.model.ChatMessage
import com.oasisbio.app.domain.model.ChatSession
import com.oasisbio.app.domain.model.MessageRole
import com.oasisbio.app.domain.repository.AssistantRepository
import com.oasisbio.app.domain.repository.AssistantType
import timber.log.Timber
import javax.inject.Inject

class AssistantRepositoryImpl @Inject constructor(
    private val oasisBioApi: OasisBioApi
) : AssistantRepository {

    override suspend fun getSessions(): Result<List<ChatSession>> {
        return try {
            val response = oasisBioApi.getChatSessions()
            if (response.isSuccessful) {
                Result.success(response.body()?.map { it.toChatSession() } ?: emptyList())
            } else {
                Result.failure(createApiException(response.code(), "Failed to get sessions"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting sessions")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun createSession(title: String?): Result<ChatSession> {
        return try {
            val response = oasisBioApi.createChatSession(CreateChatSessionRequest(title))
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it.toChatSession())
                } ?: Result.failure(ApiException.ServerError("Failed to create session"))
            } else {
                Result.failure(createApiException(response.code(), "Failed to create session"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error creating session")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun getSession(sessionId: String): Result<ChatSession> {
        return try {
            val response = oasisBioApi.getChatSession(sessionId)
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it.toChatSession())
                } ?: Result.failure(ApiException.NotFound("Session not found"))
            } else {
                Result.failure(createApiException(response.code(), "Failed to get session"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting session: $sessionId")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun deleteSession(sessionId: String): Result<Unit> {
        return try {
            val response = oasisBioApi.deleteChatSession(sessionId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(createApiException(response.code(), "Failed to delete session"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error deleting session: $sessionId")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun getMessages(sessionId: String): Result<List<ChatMessage>> {
        return try {
            val response = oasisBioApi.getChatMessages(sessionId)
            if (response.isSuccessful) {
                Result.success(response.body()?.map { it.toChatMessage() } ?: emptyList())
            } else {
                Result.failure(createApiException(response.code(), "Failed to get messages"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error getting messages for session: $sessionId")
            Result.failure(ApiException.NetworkError(e.message ?: "Network error"))
        }
    }

    override suspend fun sendMessage(
        sessionId: String,
        content: String,
        assistantType: AssistantType
    ): Result<ChatMessage> {
        return try {
            val response = oasisBioApi.sendChatMessage(
                SendChatMessageRequest(
                    sessionId = sessionId,
                    content = content,
                    assistantType = assistantType.name
                )
            )
            if (response.isSuccessful) {
                response.body()?.let {
                    Result.success(it.toChatMessage())
                } ?: Result.failure(ApiException.ServerError("Failed to send message"))
            } else {
                Result.failure(createApiException(response.code(), "Failed to send message"))
            }
        } catch (e: Exception) {
            Timber.e(e, "Error sending message")
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

    private fun ChatSessionResponse.toChatSession(): ChatSession {
        return ChatSession(
            id = id,
            title = title,
            assistantType = assistantType,
            lastMessage = lastMessage,
            messageCount = messageCount,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    private fun ChatMessageResponse.toChatMessage(): ChatMessage {
        return ChatMessage(
            id = id,
            sessionId = sessionId,
            content = content,
            role = when (role.lowercase()) {
                "user" -> MessageRole.USER
                "assistant" -> MessageRole.ASSISTANT
                else -> MessageRole.SYSTEM
            },
            assistantType = assistantType,
            createdAt = createdAt
        )
    }
}
