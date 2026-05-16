package com.oasisbio.app.di

import android.content.Context
import com.oasisbio.app.BuildConfig
import com.oasisbio.app.data.local.AuthDataStore
import com.oasisbio.app.data.remote.SupabaseClientProvider
import com.oasisbio.app.data.repository.AssistantRepositoryImpl
import com.oasisbio.app.data.repository.AuthRepositoryImpl
import com.oasisbio.app.data.repository.IdentityRepositoryImpl
import com.oasisbio.app.data.repository.WorldRepositoryImpl
import com.oasisbio.app.domain.repository.AssistantRepository
import com.oasisbio.app.domain.repository.AuthRepository
import com.oasisbio.app.domain.repository.IdentityRepository
import com.oasisbio.app.domain.repository.WorldRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.github.jan_tennert.supabase.SupabaseClient
import io.github.jan_tennert.supabase.auth.GoTrue
import io.github.jan_tennert.supabase.createSupabaseClient
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindIdentityRepository(impl: IdentityRepositoryImpl): IdentityRepository

    @Binds
    @Singleton
    abstract fun bindAssistantRepository(impl: AssistantRepositoryImpl): AssistantRepository

    @Binds
    @Singleton
    abstract fun bindWorldRepository(impl: WorldRepositoryImpl): WorldRepository

    companion object {

        @Provides
        @Singleton
        fun provideSupabaseClient(): SupabaseClient {
            return createSupabaseClient(
                supabaseUrl = BuildConfig.SUPABASE_URL,
                supabaseKey = BuildConfig.SUPABASE_ANON_KEY
            ) {
                install(GoTrue)
            }
        }

        @Provides
        @Singleton
        fun provideSupabaseClientFromProvider(
            provider: SupabaseClientProvider
        ): SupabaseClient {
            return provider.supabaseClient
        }

        @Provides
        @Singleton
        fun provideAuthDataStore(@ApplicationContext context: Context): AuthDataStore {
            return AuthDataStore(context)
        }
    }
}