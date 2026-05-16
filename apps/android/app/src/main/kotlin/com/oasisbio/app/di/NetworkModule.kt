package com.oasisbio.app.di

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkRequest
import com.oasisbio.app.BuildConfig
import com.oasisbio.app.data.remote.OasisBioApi
import com.oasisbio.app.data.remote.interceptor.PerformanceMonitoringInterceptor
import com.oasisbio.app.data.remote.interceptor.RequestDeduplicationInterceptor
import com.oasisbio.app.data.remote.job.CoroutineJobManager
import com.oasisbio.app.util.PerformanceMonitor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.Cache
import okhttp3.CacheControl
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.File
import java.util.concurrent.TimeUnit
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    private const val CACHE_SIZE = 50L * 1024 * 1024
    private const val CACHE_DIR_NAME = "http_cache"
    private const val MAX_AGE_ONLINE = 60
    private const val MAX_STALE_OFFLINE = 7 * 24 * 60

    @Provides
    @Singleton
    fun provideCache(@ApplicationContext context: Context): Cache {
        val cacheDir = File(context.cacheDir, CACHE_DIR_NAME)
        return Cache(cacheDir, CACHE_SIZE)
    }

    @Provides
    @Singleton
    fun providePerformanceMonitor(@ApplicationContext context: Context): PerformanceMonitor {
        return PerformanceMonitor.getInstance(context)
    }

    @Provides
    @Singleton
    fun provideCoroutineJobManager(): CoroutineJobManager {
        return CoroutineJobManager()
    }

    @Provides
    @Singleton
    fun provideRequestDeduplicationInterceptor(): RequestDeduplicationInterceptor {
        return RequestDeduplicationInterceptor()
    }

    @Provides
    @Singleton
    fun providePerformanceMonitoringInterceptor(
        performanceMonitor: PerformanceMonitor
    ): PerformanceMonitoringInterceptor {
        return PerformanceMonitoringInterceptor(performanceMonitor)
    }

    @Provides
    @Singleton
    fun provideNetworkConnectivityInterceptor(
        @ApplicationContext context: Context
    ): Interceptor {
        return Interceptor { chain ->
            var request = chain.request()

            if (!isNetworkAvailable(context)) {
                val cacheControl = CacheControl.Builder()
                    .maxStale(MAX_STALE_OFFLINE, TimeUnit.MINUTES)
                    .build()

                request = request.newBuilder()
                    .cacheControl(cacheControl)
                    .build()
            }

            chain.proceed(request)
        }
    }

    @Provides
    @Singleton
    fun provideCacheResponseInterceptor(): Interceptor {
        return Interceptor { chain ->
            val response = chain.proceed(chain.request())

            val cacheControl = if (isCacheableResponse(response)) {
                CacheControl.Builder()
                    .maxAge(MAX_AGE_ONLINE, TimeUnit.MINUTES)
                    .build()
            } else {
                CacheControl.Builder()
                    .maxStale(MAX_STALE_OFFLINE, TimeUnit.MINUTES)
                    .build()
            }

            response.newBuilder()
                .removeHeader("Pragma")
                .removeHeader("Cache-Control")
                .header("Cache-Control", cacheControl.toString())
                .build()
        }
    }

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }

    @Provides
    @Singleton
    fun provideAuthInterceptor(): Interceptor {
        return Interceptor { chain ->
            val originalRequest = chain.request()
            val request = originalRequest.newBuilder()
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .method(originalRequest.method, originalRequest.body)
                .build()
            chain.proceed(request)
        }
    }

    @Provides
    @Singleton
    fun provideErrorInterceptor(): Interceptor {
        return Interceptor { chain ->
            val request = chain.request()
            try {
                val response = chain.proceed(request)
                if (!response.isSuccessful) {
                    when (response.code) {
                        401 -> throw UnauthorizedException("Unauthorized access")
                        403 -> throw ForbiddenException("Forbidden access")
                        404 -> throw NotFoundException("Resource not found")
                        500 -> throw ServerException("Internal server error")
                        else -> throw ApiException("API error: ${response.code}")
                    }
                }
                response
            } catch (e: Exception) {
                throw e
            }
        }
    }

    private fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun isCacheableResponse(response: okhttp3.Response): Boolean {
        val request = response.request
        return request.method == "GET" &&
                response.code in 200..299 &&
                response.header("Cache-Control") != null
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        cache: Cache,
        loggingInterceptor: HttpLoggingInterceptor,
        authInterceptor: Interceptor,
        errorInterceptor: Interceptor,
        networkConnectivityInterceptor: Interceptor,
        cacheResponseInterceptor: Interceptor,
        requestDeduplicationInterceptor: RequestDeduplicationInterceptor,
        performanceMonitoringInterceptor: PerformanceMonitoringInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .cache(cache)
            .addInterceptor(authInterceptor)
            .addInterceptor(requestDeduplicationInterceptor)
            .addInterceptor(networkConnectivityInterceptor)
            .addInterceptor(loggingInterceptor)
            .addInterceptor(performanceMonitoringInterceptor)
            .addInterceptor(errorInterceptor)
            .addNetworkInterceptor(cacheResponseInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    @Provides
    @Singleton
    @Named("Retrofit")
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(getOptimizedGsonConfig()))
            .build()
    }

    @Provides
    @Singleton
    fun provideOasisBioApi(@Named("Retrofit") retrofit: Retrofit): OasisBioApi {
        return retrofit.create(OasisBioApi::class.java)
    }

    private fun getOptimizedGsonConfig(): com.google.gson.Gson {
        return com.google.gson.GsonBuilder()
            .setLenient()
            .disableHtmlEscaping()
            .create()
    }
}

class ApiException(message: String) : Exception(message)
class UnauthorizedException(message: String) : Exception(message)
class ForbiddenException(message: String) : Exception(message)
class NotFoundException(message: String) : Exception(message)
class ServerException(message: String) : Exception(message)
