package com.oasisbio.app.presentation.ui.theme

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "settings")

class ThemeManager(private val context: Context) {

    private val darkModeKey = booleanPreferencesKey("dark_mode")

    val isDarkMode: Flow<Boolean> = context.dataStore.data
        .map { preferences ->
            preferences[darkModeKey] ?: false
        }

    suspend fun setDarkMode(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[darkModeKey] = enabled
        }
    }
}
