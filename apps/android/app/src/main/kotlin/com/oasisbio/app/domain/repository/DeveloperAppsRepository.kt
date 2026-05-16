package com.oasisbio.app.domain.repository

import com.oasisbio.app.presentation.ui.screens.OAuthApp
import com.oasisbio.app.presentation.ui.screens.OAuthAppRegistration

interface DeveloperAppsRepository {
    suspend fun getApps(): Result<List<OAuthApp>>
    suspend fun getAppById(id: String): Result<OAuthApp>
    suspend fun createApp(registration: OAuthAppRegistration): Result<OAuthApp>
    suspend fun updateApp(app: OAuthApp): Result<OAuthApp>
    suspend fun deleteApp(id: String): Result<Unit>
}
