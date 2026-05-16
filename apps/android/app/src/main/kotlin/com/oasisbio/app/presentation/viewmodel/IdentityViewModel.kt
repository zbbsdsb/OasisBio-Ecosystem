package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.usecase.identity.DeleteIdentityUseCase
import com.oasisbio.app.domain.usecase.identity.GetAllIdentitiesUseCase
import com.oasisbio.app.domain.usecase.identity.GetIdentityByIdUseCase
import com.oasisbio.app.domain.usecase.identity.CreateIdentityUseCase
import com.oasisbio.app.domain.usecase.identity.UpdateIdentityUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class IdentityViewModel @Inject constructor(
    private val getAllIdentitiesUseCase: GetAllIdentitiesUseCase,
    private val getIdentityByIdUseCase: GetIdentityByIdUseCase,
    private val createIdentityUseCase: CreateIdentityUseCase,
    private val updateIdentityUseCase: UpdateIdentityUseCase,
    private val deleteIdentityUseCase: DeleteIdentityUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(IdentityUiState())
    val uiState: StateFlow<IdentityUiState> = _uiState.asStateFlow()

    fun loadIdentities() {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            getAllIdentitiesUseCase()
                .onSuccess { identities ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        identities = identities
                    )
                    Timber.d("Loaded ${identities.size} identities")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to load identities")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                }
        }
    }

    fun loadIdentityById(id: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            getIdentityByIdUseCase(id)
                .onSuccess { identity ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        selectedIdentity = identity
                    )
                    Timber.d("Loaded identity: $id")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to load identity: $id")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                }
        }
    }

    fun createIdentity(identity: OasisBio) {
        _uiState.value = _uiState.value.copy(operationInProgress = true, error = null)
        viewModelScope.launch {
            createIdentityUseCase(identity)
                .onSuccess { created ->
                    _uiState.value = _uiState.value.copy(
                        operationInProgress = false,
                        identities = _uiState.value.identities + created,
                        selectedIdentity = created,
                        operationSuccess = true
                    )
                    Timber.d("Created identity: ${created.id}")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to create identity")
                    _uiState.value = _uiState.value.copy(
                        operationInProgress = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                }
        }
    }

    fun updateIdentity(id: String, identity: OasisBio) {
        _uiState.value = _uiState.value.copy(operationInProgress = true, error = null)
        viewModelScope.launch {
            updateIdentityUseCase(id, identity)
                .onSuccess { updated ->
                    _uiState.value = _uiState.value.copy(
                        operationInProgress = false,
                        identities = _uiState.value.identities.map {
                            if (it.id == id) updated else it
                        },
                        selectedIdentity = updated,
                        operationSuccess = true
                    )
                    Timber.d("Updated identity: $id")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to update identity: $id")
                    _uiState.value = _uiState.value.copy(
                        operationInProgress = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                }
        }
    }

    fun deleteIdentity(id: String) {
        _uiState.value = _uiState.value.copy(operationInProgress = true, error = null)
        viewModelScope.launch {
            deleteIdentityUseCase(id)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(
                        operationInProgress = false,
                        identities = _uiState.value.identities.filter { it.id != id },
                        selectedIdentity = null,
                        operationSuccess = true
                    )
                    Timber.d("Deleted identity: $id")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to delete identity: $id")
                    _uiState.value = _uiState.value.copy(
                        operationInProgress = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                }
        }
    }

    fun selectIdentity(identity: OasisBio?) {
        _uiState.value = _uiState.value.copy(selectedIdentity = identity)
        Timber.d("Selected identity: ${identity?.id ?: "none"}")
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearSuccess() {
        _uiState.value = _uiState.value.copy(operationSuccess = false)
    }

    fun retryLastAction() {
        val state = _uiState.value
        when {
            state.identities.isEmpty() && !state.isLoading -> {
                loadIdentities()
            }
            state.selectedIdentity != null && !state.isLoading -> {
                loadIdentityById(state.selectedIdentity.id)
            }
        }
    }

    fun refresh() {
        loadIdentities()
    }

    private fun getFriendlyErrorMessage(exception: Exception): String {
        return when (exception) {
            is ApiException -> {
                when (exception) {
                    is ApiException.NetworkError -> "网络连接失败，请检查网络设置"
                    is ApiException.Unauthorized -> "登录已过期，请重新登录"
                    is ApiException.Forbidden -> "您没有权限执行此操作"
                    is ApiException.NotFound -> "身份信息不存在"
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
                    exception.message?.contains("not found", ignoreCase = true) == true ->
                        "身份信息不存在"
                    exception.message?.contains("already exists", ignoreCase = true) == true ->
                        "该身份名称已存在"
                    exception.message?.contains("rate", ignoreCase = true) == true ->
                        "请求过于频繁，请稍后再试"
                    else -> exception.message ?: "操作失败，请稍后重试"
                }
            }
        }
    }
}

data class IdentityUiState(
    val identities: List<OasisBio> = emptyList(),
    val selectedIdentity: OasisBio? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val operationInProgress: Boolean = false,
    val operationSuccess: Boolean = false
)