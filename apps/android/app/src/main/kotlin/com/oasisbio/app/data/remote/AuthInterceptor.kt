package com.oasisbio.app.data.remote

import com.oasisbio.app.data.local.AuthDataStore
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(
    private val authDataStore: AuthDataStore
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        val token = runBlocking {
            authDataStore.getAccessToken()
        }

        val request = if (token != null) {
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Accept", "application/json")
                .build()
        } else {
            originalRequest.newBuilder()
                .addHeader("Accept", "application/json")
                .build()
        }

        return chain.proceed(request)
    }
}
