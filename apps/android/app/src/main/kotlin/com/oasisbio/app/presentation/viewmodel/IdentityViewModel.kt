package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.usecase.identity.*
import dagger.hilt.android.lifecycle.ViewModelInject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import timber.log.Timber

class IdentityViewModel @ViewModelInject constructor(
    private val getAllIdentitiesUseCase: GetAllIdentitiesUseCase,
    private val getIdentityByIdUseCase: GetIdentityByIdUseCase,
    private val createIdentityUseCase: CreateIdentityUseCase,
    private val updateIdentityUseCase: UpdateIdentityUseCase,
    private val deleteIdentityUseCase: DeleteIdentityUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(IdentityState())
    val state: StateFlow<IdentityState> = _state

    fun loadIdentities() {
        _state.value = _state.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val identities = getAllIdentitiesUseCase()
                _state.value = _state.value.copy(
                    isLoading = false,
                    identities = identities
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to load identities")
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun loadIdentity(id: String) {
        _state.value = _state.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val identity = getIdentityByIdUseCase(id)
                _state.value = _state.value.copy(
                    isLoading = false,
                    selectedIdentity = identity
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to load identity")
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun createIdentity(identity: OasisBio) {
        _state.value = _state.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val created = createIdentityUseCase(identity)
                _state.value = _state.value.copy(
                    isLoading = false,
                    identities = _state.value.identities + created,
                    operationSuccess = true
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to create identity")
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun updateIdentity(id: String, identity: OasisBio) {
        _state.value = _state.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val updated = updateIdentityUseCase(id, identity)
                _state.value = _state.value.copy(
                    isLoading = false,
                    identities = _state.value.identities.map {
                        if (it.id == id) updated else it
                    },
                    selectedIdentity = updated,
                    operationSuccess = true
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to update identity")
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun deleteIdentity(id: String) {
        _state.value = _state.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                deleteIdentityUseCase(id)
                _state.value = _state.value.copy(
                    isLoading = false,
                    identities = _state.value.identities.filter { it.id != id },
                    selectedIdentity = null,
                    operationSuccess = true
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to delete identity")
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    fun clearSuccess() {
        _state.value = _state.value.copy(operationSuccess = false)
    }
}

data class IdentityState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val identities: List<OasisBio> = emptyList(),
    val selectedIdentity: OasisBio? = null,
    val operationSuccess: Boolean = false
)