package com.oasisbio.app

import android.app.Application
import android.app.SplashScreen
import android.os.Build
import com.oasisbio.app.BuildConfig
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import timber.log.Timber

@HiltAndroidApp
class OasisBioApplication : Application() {

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private var splashScreen: SplashScreen? = null

    override fun onCreate() {
        val startTime = System.currentTimeMillis()

        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }

        super.onCreate()

        initializeApp(startTime)
    }

    private fun initializeApp(startTime: Long) {
        applicationScope.launch(Dispatchers.Default) {
            try {
                initializeCriticalModules()

                launch(Dispatchers.IO) {
                    initializeNonCriticalModules()
                }

                reportStartupTime(startTime)
            } catch (e: Exception) {
                Timber.e(e, "Error during app initialization")
            }
        }
    }

    private suspend fun initializeCriticalModules() {
        initializeCrashReporter()
        initializePerformanceMonitor()
    }

    private suspend fun initializeNonCriticalModules() {
        try {
            initializeAnalytics()
            initializeImageCache()
            initializeNetworkCache()
            initializeThirdPartySDKs()
        } catch (e: Exception) {
            Timber.w(e, "Non-critical initialization failed")
        }
    }

    private fun initializeCrashReporter() {
        if (!BuildConfig.DEBUG) {
            Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
                Timber.e(throwable, "Uncaught exception in thread: ${thread.name}")
            }
        }
    }

    private fun initializePerformanceMonitor() {
        if (BuildConfig.DEBUG) {
            Timber.d("Performance monitoring initialized")
        }
    }

    private fun initializeAnalytics() {
        Timber.d("Analytics initialized (lazy)")
    }

    private fun initializeImageCache() {
        val imageCacheSize = 25 * 1024 * 1024L
        Timber.d("Image cache initialized with size: $imageCacheSize")
    }

    private fun initializeNetworkCache() {
        val networkCacheSize = 10 * 1024 * 1024L
        Timber.d("Network cache initialized with size: $networkCacheSize")
    }

    private fun initializeThirdPartySDKs() {
        Timber.d("Third-party SDKs initialized (lazy)")
    }

    private fun reportStartupTime(startTime: Long) {
        val startupTime = System.currentTimeMillis() - startTime
        if (BuildConfig.DEBUG) {
            Timber.d("App initialization completed in ${startupTime}ms")
        }

        splashScreen?.let { screen ->
            screen.setKeepOnScreenCondition { false }
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        Timber.w("Low memory warning received")
        clearMemoryCache()
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        when (level) {
            TRIM_MEMORY_RUNNING_LOW,
            TRIM_MEMORY_RUNNING_CRITICAL -> {
                Timber.d("Trim memory: $level - clearing caches")
                clearMemoryCache()
            }
        }
    }

    private fun clearMemoryCache() {
        System.gc()
    }

    companion object {
        private const val TAG = "OasisBioApplication"
    }
}
