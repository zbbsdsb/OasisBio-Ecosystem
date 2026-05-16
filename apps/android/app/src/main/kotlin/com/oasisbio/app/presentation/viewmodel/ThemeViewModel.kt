package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasisbio.app.presentation.ui.theme.ThemeManager
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.content.Context

@HiltViewModel
class ThemeViewModel @Inject constructor(
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val themeManager = ThemeManager(context)

    val isDarkMode: StateFlow<Boolean> = themeManager.isDarkMode
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = false
        )

    fun toggleDarkMode() {
        viewModelScope.launch {
            themeManager.setDarkMode(!isDarkMode.value)
        }
    }

    fun setDarkMode(enabled: Boolean) {
        viewModelScope.launch {
            themeManager.setDarkMode(enabled)
        }
    }
}
