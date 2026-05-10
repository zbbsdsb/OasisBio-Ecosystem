package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.domain.usecase.auth.SignInWithOtpUseCase
import com.oasisbio.app.domain.usecase.auth.SignOutUseCase
import com.oasisbio.app.domain.usecase.auth.VerifyOtpUseCase
import dagger.hilt.android.lifecycle.ViewModelInject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import timber.log.Timber

class AuthViewModel @ViewModelInject constructor(
    private val signInWithOtpUseCase: SignInWithOtpUseCase,
    private val verifyOtpUseCase: VerifyOtpUseCase,
    private val signOutUseCase: SignOutUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state

    fun sendOtp(email: String) {
        _state.value = _state.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                signInWithOtpUseCase(email)
                _state.value = _state.value.copy(
                    isLoading = false,
                    otpSent = true,
                    email = email
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to send OTP")
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun verifyOtp(otp: String) {
        _state.value = _state.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                verifyOtpUseCase(_state.value.email ?: "", otp)
                _state.value = _state.value.copy(
                    isLoading = false,
                    isAuthenticated = true
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to verify OTP")
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            try {
                signOutUseCase()
                _state.value = AuthState()
            } catch (e: Exception) {
                Timber.e(e, "Failed to sign out")
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    fun resetOtpState() {
        _state.value = _state.value.copy(otpSent = false, email = null)
    }
}

data class AuthState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val otpSent: Boolean = false,
    val email: String? = null,
    val isAuthenticated: Boolean = false
)