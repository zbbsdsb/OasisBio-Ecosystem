package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.data.remote.ApiException
import com.oasisbio.app.domain.model.Ability
import com.oasisbio.app.domain.model.AbilityListState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class AbilityViewModel @Inject constructor() : ViewModel() {

    private val _uiState = MutableStateFlow(AbilityListState())
    val uiState: StateFlow<AbilityListState> = _uiState.asStateFlow()

    init {
        loadAbilities()
    }

    fun loadAbilities() {
        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            try {
                delay(500)
                val mockAbilities = listOf(
                    Ability(
                        id = "1",
                        oasisBioId = "oasis-1",
                        name = "火焰操控",
                        category = "元素系",
                        sourceType = "超自然",
                        level = 5,
                        description = "控制和召唤火焰的能力，可以操纵火焰的形状、温度和强度",
                        relatedWorldId = "world-1",
                        relatedEraId = null,
                        createdAt = System.currentTimeMillis().toString(),
                        updatedAt = System.currentTimeMillis().toString()
                    ),
                    Ability(
                        id = "2",
                        oasisBioId = "oasis-1",
                        name = "瞬间移动",
                        category = "空间系",
                        sourceType = "超自然",
                        level = 4,
                        description = "在空间中快速移动的能力，可以实现短距离瞬移",
                        relatedWorldId = "world-1",
                        relatedEraId = null,
                        createdAt = System.currentTimeMillis().toString(),
                        updatedAt = System.currentTimeMillis().toString()
                    ),
                    Ability(
                        id = "3",
                        oasisBioId = "oasis-1",
                        name = "心灵感应",
                        category = "精神系",
                        sourceType = "超自然",
                        level = 3,
                        description = "读取和传递思想的能力，可以与他人进行心灵交流",
                        relatedWorldId = null,
                        relatedEraId = null,
                        createdAt = System.currentTimeMillis().toString(),
                        updatedAt = System.currentTimeMillis().toString()
                    ),
                    Ability(
                        id = "4",
                        oasisBioId = "oasis-1",
                        name = "时间暂停",
                        category = "时间系",
                        sourceType = "超自然",
                        level = 6,
                        description = "短暂停止时间流动的能力，可以使周围环境的时间暂时停止",
                        relatedWorldId = "world-2",
                        relatedEraId = null,
                        createdAt = System.currentTimeMillis().toString(),
                        updatedAt = System.currentTimeMillis().toString()
                    ),
                    Ability(
                        id = "5",
                        oasisBioId = "oasis-1",
                        name = "念力",
                        category = "精神系",
                        sourceType = "超自然",
                        level = 4,
                        description = "通过精神力量移动物体的能力",
                        relatedWorldId = null,
                        relatedEraId = null,
                        createdAt = System.currentTimeMillis().toString(),
                        updatedAt = System.currentTimeMillis().toString()
                    ),
                    Ability(
                        id = "6",
                        oasisBioId = "oasis-1",
                        name = "冰霜操控",
                        category = "元素系",
                        sourceType = "超自然",
                        level = 3,
                        description = "控制和操纵冰与霜的能力",
                        relatedWorldId = "world-1",
                        relatedEraId = null,
                        createdAt = System.currentTimeMillis().toString(),
                        updatedAt = System.currentTimeMillis().toString()
                    )
                )
                _uiState.update { it.copy(isLoading = false, abilities = mockAbilities) }
                Timber.d("Loaded ${mockAbilities.size} abilities")
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = getFriendlyErrorMessage(e)) }
                Timber.e(e, "Failed to load abilities")
            }
        }
    }

    fun deleteAbility(abilityId: String) {
        _uiState.update { it.copy(operationInProgress = true, error = null) }
        viewModelScope.launch {
            try {
                delay(300)
                _uiState.update { state ->
                    state.copy(
                        operationInProgress = false,
                        abilities = state.abilities.filter { it.id != abilityId }
                    )
                }
                Timber.d("Deleted ability: $abilityId")
            } catch (e: Exception) {
                _uiState.update { it.copy(operationInProgress = false, error = getFriendlyErrorMessage(e)) }
                Timber.e(e, "Failed to delete ability: $abilityId")
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun refresh() {
        loadAbilities()
    }

    private fun getFriendlyErrorMessage(exception: Exception): String {
        return when (exception) {
            is ApiException -> {
                when (exception) {
                    is ApiException.NetworkError -> "网络连接失败，请检查网络设置"
                    is ApiException.Unauthorized -> "登录已过期，请重新登录"
                    is ApiException.Forbidden -> "您没有权限执行此操作"
                    is ApiException.NotFound -> "能力信息不存在"
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
