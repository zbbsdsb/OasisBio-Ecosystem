package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.viewModelScope
import com.oasisbio.app.domain.repository.DeveloperAppsRepository
import com.oasisbio.app.presentation.ui.screens.OAuthApp
import com.oasisbio.app.presentation.ui.screens.OAuthAppRegistration
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class DeveloperAppsViewModel @Inject constructor(
    private val developerAppsRepository: DeveloperAppsRepository
) : BaseViewModel() {

    private val _uiState = MutableStateFlow(DeveloperAppsUiState())
    val uiState: StateFlow<DeveloperAppsUiState> = _uiState.asStateFlow()

    private val _apps = MutableStateFlow<List<OAuthApp>>(emptyList())
    val apps: StateFlow<List<OAuthApp>> = _apps.asStateFlow()

    fun loadApps() {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            developerAppsRepository.getApps()
                .onSuccess { loadedApps ->
                    _apps.value = loadedApps
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    Timber.d("Loaded ${loadedApps.size} OAuth apps")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to load OAuth apps")
                }
        }
    }

    fun createApp(registration: OAuthAppRegistration) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            developerAppsRepository.createApp(registration)
                .onSuccess { newApp ->
                    _apps.value = _apps.value + newApp
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    Timber.d("Created OAuth app: ${newApp.id}")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to create OAuth app")
                }
        }
    }

    fun updateApp(app: OAuthApp) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            developerAppsRepository.updateApp(app)
                .onSuccess { updatedApp ->
                    _apps.value = _apps.value.map { if (it.id == updatedApp.id) updatedApp else it }
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    Timber.d("Updated OAuth app: ${updatedApp.id}")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to update OAuth app")
                }
        }
    }

    fun deleteApp(appId: String) {
        viewModelScope.launch {
            developerAppsRepository.deleteApp(appId)
                .onSuccess {
                    _apps.value = _apps.value.filter { it.id != appId }
                    Timber.d("Deleted OAuth app: $appId")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to delete OAuth app: $appId")
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    private fun getFriendlyErrorMessage(exception: Exception): String {
        return when {
            exception.message?.contains("network", ignoreCase = true) == true ->
                "网络连接失败，请检查网络设置"
            exception.message?.contains("timeout", ignoreCase = true) == true ->
                "请求超时，请稍后重试"
            exception.message?.contains("401", ignoreCase = true) == true ->
                "登录已过期，请重新登录"
            exception.message?.contains("403", ignoreCase = true) == true ->
                "您没有权限执行此操作"
            exception.message?.contains("404", ignoreCase = true) == true ->
                "应用不存在"
            exception.message?.contains("500", ignoreCase = true) == true ->
                "服务器错误，请稍后重试"
            else -> exception.message ?: "操作失败，请稍后重试"
        }
    }
}

data class DeveloperAppsUiState(
    val isLoading: Boolean = false,
    val error: String? = null
)
