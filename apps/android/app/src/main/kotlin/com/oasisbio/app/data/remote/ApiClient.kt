package com.oasisbio.app.data.remote

import com.oasisbio.app.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiClient @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val authInterceptor: AuthInterceptor,
    private val errorInterceptor: ErrorInterceptor
) {

    private val loggingInterceptor: HttpLoggingInterceptor by lazy {
        HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }

    private val configuredOkHttpClient: OkHttpClient by lazy {
        okHttpClient.newBuilder()
            .addInterceptor(authInterceptor)
            .addInterceptor(errorInterceptor)
            .addInterceptor(loggingInterceptor)
            .build()
    }

    val oasisBioApi: OasisBioApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(configuredOkHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(OasisBioApi::class.java)
    }
}
