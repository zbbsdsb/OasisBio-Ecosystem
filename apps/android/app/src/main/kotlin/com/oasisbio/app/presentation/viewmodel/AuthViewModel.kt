package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.domain.model.Session
import com.oasisbio.app.domain.usecase.auth.SignInWithOtpUseCase
import com.oasisbio.app.domain.usecase.auth.SignOutUseCase
import com.oasisbio.app.domain.usecase.auth.VerifyOtpUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val signInWithOtpUseCase: SignInWithOtpUseCase,
    private val verifyOtpUseCase: VerifyOtpUseCase,
    private val signOutUseCase: SignOutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var countdownJob: Job? = null

    fun sendOtp(email: String) {
        if (email.isBlank() || !email.contains("@")) {
            _uiState.value = _uiState.value.copy(
                error = "请输入有效的邮箱地址"
            )
            return
        }

        _uiState.value = _uiState.value.copy(
            isLoading = true,
            error = null,
            email = email
        )

        viewModelScope.launch {
            signInWithOtpUseCase(email)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isOtpSent = true,
                        countdown = 60
                    )
                    startCountdown()
                    Timber.d("OTP sent successfully to $email")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to send OTP to $email")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isOtpSent = false,
                        error = getFriendlyErrorMessage(exception)
                    )
                }
        }
    }

    private fun startCountdown() {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            while (_uiState.value.countdown > 0) {
                delay(1000)
                _uiState.value = _uiState.value.copy(countdown = _uiState.value.countdown - 1)
            }
        }
    }

    fun verifyOtp(code: String) {
        if (code.isBlank() || code.length < 6) {
            _uiState.value = _uiState.value.copy(
                error = "请输入6位验证码"
            )
            return
        }

        val currentEmail = _uiState.value.email
        if (currentEmail.isNullOrBlank()) {
            _uiState.value = _uiState.value.copy(
                error = "邮箱地址无效，请重新发送验证码"
            )
            return
        }

        _uiState.value = _uiState.value.copy(
            isLoading = true,
            error = null,
            otpCode = code
        )

        viewModelScope.launch {
            verifyOtpUseCase(currentEmail, code)
                .onSuccess { session ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        session = session
                    )
                    countdownJob?.cancel()
                    Timber.d("OTP verified successfully for $currentEmail")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to verify OTP for $currentEmail")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        otpCode = "",
                        error = getFriendlyErrorMessage(exception)
                    )
                }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            signOutUseCase()
                .onSuccess {
                    _uiState.value = AuthUiState()
                    Timber.d("User signed out successfully")
                }
                .onFailure { exception ->
                    Timber.e(exception, "Failed to sign out")
                    _uiState.value = AuthUiState()
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun resetOtpState() {
        countdownJob?.cancel()
        _uiState.value = _uiState.value.copy(
            isOtpSent = false,
            otpCode = "",
            email = "",
            countdown = 0
        )
    }

    fun retryLastAction() {
        val state = _uiState.value
        when {
            state.isOtpSent && !state.email.isNullOrBlank() -> {
                sendOtp(state.email)
            }
            !state.otpCode.isNullOrBlank() && !state.email.isNullOrBlank() -> {
                verifyOtp(state.otpCode)
            }
        }
    }

    private fun getFriendlyErrorMessage(exception: Exception): String {
        return when (exception) {
            is com.oasisbio.app.data.remote.ApiException -> {
                when (exception) {
                    is com.oasisbio.app.data.remote.ApiException.NetworkError ->
                        "网络连接失败，请检查网络设置"
                    is com.oasisbio.app.data.remote.ApiException.Unauthorized ->
                        "登录已过期，请重新登录"
                    is com.oasisbio.app.data.remote.ApiException.Forbidden ->
                        "您没有权限执行此操作"
                    is com.oasisbio.app.data.remote.ApiException.NotFound ->
                        "请求的资源不存在"
                    is com.oasisbio.app.data.remote.ApiException.ServerError ->
                        "服务器错误，请稍后重试"
                    is com.oasisbio.app.data.remote.ApiException.BadRequest ->
                        exception.message ?: "请求参数错误"
                    is com.oasisbio.app.data.remote.ApiException.UnknownError ->
                        exception.message ?: "操作失败，请稍后重试"
                }
            }
            else -> {
                when {
                    exception.message?.contains("network", ignoreCase = true) == true ->
                        "网络连接失败，请检查网络设置"
                    exception.message?.contains("timeout", ignoreCase = true) == true ->
                        "请求超时，请稍后重试"
                    exception.message?.contains("invalid", ignoreCase = true) == true ->
                        "验证码无效或已过期"
                    exception.message?.contains("user", ignoreCase = true) == true ->
                        "用户不存在或邮箱格式不正确"
                    exception.message?.contains("rate", ignoreCase = true) == true ->
                        "请求过于频繁，请稍后再试"
                    else -> exception.message ?: "操作失败，请稍后重试"
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        countdownJob?.cancel()
    }
}

data class AuthUiState(
    val isLoading: Boolean = false,
    val email: String = "",
    val otpCode: String = "",
    val error: String? = null,
    val isOtpSent: Boolean = false,
    val isLoggedIn: Boolean = false,
    val session: Session? = null,
    val countdown: Int = 0
)