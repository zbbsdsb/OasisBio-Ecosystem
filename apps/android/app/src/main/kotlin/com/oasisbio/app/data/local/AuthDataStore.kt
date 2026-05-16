package com.oasisbio.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.oasisbio.app.domain.model.Session
import com.oasisbio.app.domain.model.UserProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
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
        val EXPIRES_IN_KEY = longPreferencesKey("expires_in")
        val EXPIRES_AT_KEY = longPreferencesKey("expires_at")
        val TOKEN_TYPE_KEY = stringPreferencesKey("token_type")
        val USER_ID_KEY = stringPreferencesKey("user_id")
        val IS_LOGGED_IN_KEY = booleanPreferencesKey("is_logged_in")
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

    val isLoggedIn: Flow<Boolean> = context.dataStore.data
        .map { preferences ->
            preferences[IS_LOGGED_IN_KEY] == true && preferences[ACCESS_TOKEN_KEY] != null
        }

    val currentSession: Flow<Session?> = context.dataStore.data
        .map { preferences ->
            val accessToken = preferences[ACCESS_TOKEN_KEY]
            val refreshToken = preferences[REFRESH_TOKEN_KEY]
            val expiresIn = preferences[EXPIRES_IN_KEY]
            val expiresAt = preferences[EXPIRES_AT_KEY]
            val tokenType = preferences[TOKEN_TYPE_KEY]
            val userId = preferences[USER_ID_KEY]

            if (accessToken != null && refreshToken != null && userId != null) {
                Session(
                    accessToken = accessToken,
                    refreshToken = refreshToken,
                    expiresIn = expiresIn ?: 3600,
                    expiresAt = expiresAt ?: 0,
                    tokenType = tokenType ?: "Bearer",
                    userId = userId
                )
            } else {
                null
            }
        }

    suspend fun saveUserProfile(profile: UserProfile) {
        context.dataStore.edit { preferences ->
            preferences[USER_PROFILE_KEY] = Json.encodeToString(profile)
            preferences[USER_ID_KEY] = profile.id
            preferences[IS_LOGGED_IN_KEY] = true
        }
    }

    suspend fun saveTokens(accessToken: String, refreshToken: String) {
        context.dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = accessToken
            preferences[REFRESH_TOKEN_KEY] = refreshToken
            preferences[IS_LOGGED_IN_KEY] = true
        }
    }

    suspend fun saveSession(session: Session) {
        context.dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = session.accessToken
            preferences[REFRESH_TOKEN_KEY] = session.refreshToken
            preferences[EXPIRES_IN_KEY] = session.expiresIn
            preferences[EXPIRES_AT_KEY] = session.expiresAt
            preferences[TOKEN_TYPE_KEY] = session.tokenType
            preferences[USER_ID_KEY] = session.userId
            preferences[IS_LOGGED_IN_KEY] = true
        }
    }

    suspend fun updateTokens(accessToken: String, refreshToken: String, expiresIn: Long) {
        context.dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = accessToken
            preferences[REFRESH_TOKEN_KEY] = refreshToken
            preferences[EXPIRES_IN_KEY] = expiresIn
            preferences[EXPIRES_AT_KEY] = System.currentTimeMillis() / 1000 + expiresIn
        }
    }

    suspend fun getAccessToken(): String? {
        return context.dataStore.data.map { it[ACCESS_TOKEN_KEY] }.firstOrNull()
    }

    suspend fun getRefreshToken(): String? {
        return context.dataStore.data.map { it[REFRESH_TOKEN_KEY] }.firstOrNull()
    }

    suspend fun getSession(): Session? {
        return currentSession.firstOrNull()
    }

    suspend fun clearAll() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}