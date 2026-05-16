package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.domain.model.ChatMessage
import com.oasisbio.app.domain.model.ChatSession
import com.oasisbio.app.domain.repository.AssistantRepository
import com.oasisbio.app.domain.repository.AssistantType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class AssistantViewModel @Inject constructor(
    private val assistantRepository: AssistantRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AssistantUiState())
    val uiState: StateFlow<AssistantUiState> = _uiState.asStateFlow()

    private val _sessions = MutableStateFlow<List<ChatSession>>(emptyList())
    val sessions: StateFlow<List<ChatSession>> = _sessions.asStateFlow()

    init {
        loadSessions()
    }

    fun loadSessions() {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            assistantRepository.getSessions()
                .onSuccess { sessions ->
                    _sessions.value = sessions
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    Timber.d("Loaded ${sessions.size} sessions")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to load sessions")
                }
        }
    }

    fun createSession(title: String? = null) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            assistantRepository.createSession(title)
                .onSuccess { session ->
                    _sessions.value = _sessions.value + session
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        currentSession = session
                    )
                    Timber.d("Created session: ${session.id}")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to create session")
                }
        }
    }

    fun selectSession(session: ChatSession) {
        _uiState.value = _uiState.value.copy(
            currentSession = session,
            messages = emptyList(),
            isLoading = true
        )
        loadMessages(session.id)
    }

    fun switchAssistantType(type: AssistantType) {
        _uiState.value = _uiState.value.copy(selectedAssistantType = type)
        Timber.d("Switched to assistant type: ${type.name}")
    }

    fun loadMessages(sessionId: String) {
        viewModelScope.launch {
            assistantRepository.getMessages(sessionId)
                .onSuccess { messages ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        messages = messages
                    )
                    Timber.d("Loaded ${messages.size} messages for session: $sessionId")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to load messages for session: $sessionId")
                }
        }
    }

    fun sendMessage(content: String) {
        val session = _uiState.value.currentSession ?: return
        if (content.isBlank()) return

        val userMessage = ChatMessage(
            id = "temp_${System.currentTimeMillis()}",
            sessionId = session.id,
            content = content,
            role = com.oasisbio.app.domain.model.MessageRole.USER,
            createdAt = System.currentTimeMillis().toString()
        )

        _uiState.value = _uiState.value.copy(
            messages = _uiState.value.messages + userMessage,
            isSending = true
        )

        viewModelScope.launch {
            assistantRepository.sendMessage(
                sessionId = session.id,
                content = content,
                assistantType = _uiState.value.selectedAssistantType
            )
                .onSuccess { response ->
                    val assistantMessage = ChatMessage(
                        id = response.id,
                        sessionId = session.id,
                        content = response.content,
                        role = com.oasisbio.app.domain.model.MessageRole.ASSISTANT,
                        assistantType = response.assistantType,
                        createdAt = response.createdAt
                    )
                    _uiState.value = _uiState.value.copy(
                        isSending = false,
                        messages = _uiState.value.messages + assistantMessage
                    )
                    Timber.d("Message sent successfully")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isSending = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to send message")
                }
        }
    }

    fun deleteSession(sessionId: String) {
        viewModelScope.launch {
            assistantRepository.deleteSession(sessionId)
                .onSuccess {
                    _sessions.value = _sessions.value.filter { it.id != sessionId }
                    if (_uiState.value.currentSession?.id == sessionId) {
                        _uiState.value = _uiState.value.copy(
                            currentSession = null,
                            messages = emptyList()
                        )
                    }
                    Timber.d("Deleted session: $sessionId")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to delete session: $sessionId")
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearCurrentSession() {
        _uiState.value = _uiState.value.copy(
            currentSession = null,
            messages = emptyList()
        )
    }

    private fun getFriendlyErrorMessage(exception: Exception): String {
        return when (exception) {
            is ApiException -> {
                when (exception) {
                    is ApiException.NetworkError -> "网络连接失败，请检查网络设置"
                    is ApiException.Unauthorized -> "登录已过期，请重新登录"
                    is ApiException.Forbidden -> "您没有权限执行此操作"
                    is ApiException.NotFound -> "会话不存在"
                    is ApiException.ServerError -> "服务器错误，请稍后重试"
                    is ApiException.BadRequest -> exception.message ?: "请求参数错误"
                    is ApiException.UnknownError -> exception.message ?: "操作失败，请稍后重试"
                }
            }
            else -> {
                when {
                    exception.message?.contains("network", ignoreCase = true) == true ->
                        "网络连接失败，请检查网络设置"
                    exception.message?.contains("timeout", ignoreCase = true) == true ->
                        "请求超时，请稍后重试"
                    else -> exception.message ?: "操作失败，请稍后重试"
                }
            }
        }
    }
}

data class AssistantUiState(
    val currentSession: ChatSession? = null,
    val messages: List<ChatMessage> = emptyList(),
    val selectedAssistantType: AssistantType = AssistantType.DEO,
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val error: String? = null
)
