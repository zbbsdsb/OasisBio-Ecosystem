package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.domain.model.World
import com.oasisbio.app.domain.model.WorldCharacter
import com.oasisbio.app.domain.model.WorldLore
import com.oasisbio.app.domain.model.WorldLocation
import com.oasisbio.app.domain.model.WorldRules
import com.oasisbio.app.domain.model.WorldWizardState
import com.oasisbio.app.domain.repository.WorldRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class WorldBuilderViewModel @Inject constructor(
    private val worldRepository: WorldRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorldBuilderUiState())
    val uiState: StateFlow<WorldBuilderUiState> = _uiState.asStateFlow()

    private val _wizardState = MutableStateFlow(WorldWizardState())
    val wizardState: StateFlow<WorldWizardState> = _wizardState.asStateFlow()

    private val _worlds = MutableStateFlow<List<World>>(emptyList())
    val worlds: StateFlow<List<World>> = _worlds.asStateFlow()

    fun loadWorlds() {
        _uiState.value = _uiState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            worldRepository.getWorlds()
                .onSuccess { worlds ->
                    _worlds.value = worlds
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    Timber.d("Loaded ${worlds.size} worlds")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to load worlds")
                }
        }
    }

    fun nextStep() {
        val current = _uiState.value.currentStep
        if (current < TOTAL_STEPS) {
            _uiState.value = _uiState.value.copy(currentStep = current + 1)
            Timber.d("Moved to step: ${current + 1}")
        }
    }

    fun previousStep() {
        val current = _uiState.value.currentStep
        if (current > 1) {
            _uiState.value = _uiState.value.copy(currentStep = current - 1)
            Timber.d("Moved back to step: ${current - 1}")
        }
    }

    fun goToStep(step: Int) {
        if (step in 1..TOTAL_STEPS) {
            _uiState.value = _uiState.value.copy(currentStep = step)
            Timber.d("Jumped to step: $step")
        }
    }

    fun updateStep1Data(name: String, description: String) {
        _wizardState.value = _wizardState.value.copy(
            step1Name = name,
            step1Description = description
        )
    }

    fun updateStep2Data(genre: String, tone: String) {
        _wizardState.value = _wizardState.value.copy(
            step2Genre = genre,
            step2Tone = tone
        )
    }

    fun updateStep3Themes(themes: List<String>) {
        _wizardState.value = _wizardState.value.copy(step3Themes = themes)
    }

    fun addCharacter(character: WorldCharacter) {
        _wizardState.value = _wizardState.value.copy(
            step4Characters = _wizardState.value.step4Characters + character
        )
    }

    fun removeCharacter(character: WorldCharacter) {
        _wizardState.value = _wizardState.value.copy(
            step4Characters = _wizardState.value.step4Characters.filter { it != character }
        )
    }

    fun addLocation(location: WorldLocation) {
        _wizardState.value = _wizardState.value.copy(
            step5Locations = _wizardState.value.step5Locations + location
        )
    }

    fun removeLocation(location: WorldLocation) {
        _wizardState.value = _wizardState.value.copy(
            step5Locations = _wizardState.value.step5Locations.filter { it != location }
        )
    }

    fun updateStep6Rules(rules: WorldRules) {
        _wizardState.value = _wizardState.value.copy(step6Rules = rules)
    }

    fun addLore(lore: WorldLore) {
        _wizardState.value = _wizardState.value.copy(
            step6Lore = _wizardState.value.step6Lore + lore
        )
    }

    fun removeLore(lore: WorldLore) {
        _wizardState.value = _wizardState.value.copy(
            step6Lore = _wizardState.value.step6Lore.filter { it != lore }
        )
    }

    fun saveWorld() {
        val state = _wizardState.value
        if (state.step1Name.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "请输入世界名称")
            return
        }

        _uiState.value = _uiState.value.copy(isSaving = true, error = null)

        val world = World(
            id = "",
            name = state.step1Name,
            description = state.step1Description,
            setting = com.oasisbio.app.domain.model.WorldSetting(
                genre = state.step2Genre,
                tone = state.step2Tone,
                themes = state.step3Themes,
                characters = state.step4Characters,
                locations = state.step5Locations,
                rules = state.step6Rules,
                lore = state.step6Lore
            ),
            createdAt = System.currentTimeMillis().toString(),
            updatedAt = System.currentTimeMillis().toString()
        )

        viewModelScope.launch {
            worldRepository.createWorld(world)
                .onSuccess { created ->
                    _worlds.value = _worlds.value + created
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        saveSuccess = true,
                        createdWorld = created
                    )
                    Timber.d("Created world: ${created.id}")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to create world")
                }
        }
    }

    fun resetWizard() {
        _wizardState.value = WorldWizardState()
        _uiState.value = WorldBuilderUiState()
        Timber.d("Wizard reset")
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearSaveSuccess() {
        _uiState.value = _uiState.value.copy(saveSuccess = false, createdWorld = null)
    }

    fun deleteWorld(worldId: String) {
        viewModelScope.launch {
            worldRepository.deleteWorld(worldId)
                .onSuccess {
                    _worlds.value = _worlds.value.filter { it.id != worldId }
                    Timber.d("Deleted world: $worldId")
                }
                .onFailure { exception ->
                    _uiState.value = _uiState.value.copy(
                        error = getFriendlyErrorMessage(exception)
                    )
                    Timber.e(exception, "Failed to delete world: $worldId")
                }
        }
    }

    private fun getFriendlyErrorMessage(exception: Exception): String {
        return when (exception) {
            is ApiException -> {
                when (exception) {
                    is ApiException.NetworkError -> "网络连接失败，请检查网络设置"
                    is ApiException.Unauthorized -> "登录已过期，请重新登录"
                    is ApiException.Forbidden -> "您没有权限执行此操作"
                    is ApiException.NotFound -> "世界不存在"
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

    companion object {
        const val TOTAL_STEPS = 6
    }
}

data class WorldBuilderUiState(
    val currentStep: Int = 1,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val createdWorld: World? = null,
    val error: String? = null
)
