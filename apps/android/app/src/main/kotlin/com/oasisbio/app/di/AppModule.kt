package com.oasisbio.app.di

import android.content.Context
import com.oasisbio.app.data.local.AuthDataStore
import com.oasisbio.app.data.remote.ApiClient
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.data.remote.SupabaseClientProvider
import com.oasisbio.app.data.repository.AuthRepositoryImpl
import com.oasisbio.app.data.repository.IdentityRepositoryImpl
import com.oasisbio.app.domain.repository.AuthRepository
import com.oasisbio.app.domain.repository.IdentityRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.github.jan_tennert.supabase.SupabaseClient
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {

    @Binds
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    abstract fun bindIdentityRepository(impl: IdentityRepositoryImpl): IdentityRepository

    companion object {

        @Provides
        @Singleton
        fun provideSupabaseClient(provider: SupabaseClientProvider): SupabaseClient {
            return provider.supabaseClient
        }

        @Provides
        @Singleton
        fun provideOasisBioApi(apiClient: ApiClient): OasisBioApi {
            return apiClient.oasisBioApi
        }

        @Provides
        @Singleton
        fun provideAuthDataStore(@ApplicationContext context: Context): AuthDataStore {
            return AuthDataStore(context)
        }
    }
}