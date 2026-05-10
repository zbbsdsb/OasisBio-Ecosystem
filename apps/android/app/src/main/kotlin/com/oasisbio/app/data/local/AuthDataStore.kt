package com.oasisbio.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.oasisbio.app.domain.model.UserProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "oasisbio_prefs")

class AuthDataStore @Inject constructor(
    private val context: Context
) {
    private companion object {
        val USER_PROFILE_KEY = stringPreferencesKey("user_profile")
        val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
    }

    val currentUser: Flow<UserProfile?> = context.dataStore.data
        .map { preferences ->
            preferences[USER_PROFILE_KEY]?.let { json ->
                try {
                    Json.decodeFromString<UserProfile>(json)
                } catch (e: Exception) {
                    null
                }
            }
        }

    suspend fun saveUserProfile(profile: UserProfile) {
        context.dataStore.edit { preferences ->
            preferences[USER_PROFILE_KEY] = Json.encodeToString(profile)
        }
    }

    suspend fun saveTokens(accessToken: String, refreshToken: String) {
        context.dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = accessToken
            preferences[REFRESH_TOKEN_KEY] = refreshToken
        }
    }

    suspend fun clearAll() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }

    suspend fun getAccessToken(): String? {
        return context.dataStore.data.map { it[ACCESS_TOKEN_KEY] }.firstOrNull()
    }
}