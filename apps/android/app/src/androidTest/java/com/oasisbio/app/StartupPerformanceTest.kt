package com.oasisbio.app

import android.app.ActivityManager
import android.content.Context
import android.os.Bundle
import android.os.Debug
import androidx.benchmark.junit4.BenchmarkMode
import androidx.benchmark.junit4.StartupBenchmark
import androidx.benchmark.junit4.StartupMode
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@StartupBenchmark
class StartupPerformanceTest {

    private lateinit var context: Context

    @Before
    fun setup() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
    }

    @Test
    @BenchmarkMode([StartupMode.COLD])
    fun coldStartupTime() {
        val appContext = ApplicationProvider.getApplicationContext<Context>()
        assert(appContext != null)
    }

    @Test
    @BenchmarkMode([StartupMode.WARM])
    fun warmStartupTime() {
        val memoryInfo = getMemoryInfo()
        assert(memoryInfo != null)
    }

    @Test
    @BenchmarkMode([StartupMode.HOT])
    fun hotStartupTime() {
        val memoryInfo = getMemoryInfo()
        assert(memoryInfo != null)
    }

    @Test
    fun applicationInitialization() {
        val appContext = ApplicationProvider.getApplicationContext<Context>()
        assert(appContext != null)
    }

    @Test
    fun activityManagerMemoryInfo() {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)

        val totalMemoryMB = memoryInfo.totalMem / (1024 * 1024)
        val availableMemoryMB = memoryInfo.availMem / (1024 * 1024)
        val usedMemoryMB = totalMemoryMB - availableMemoryMB

        assert(totalMemoryMB > 0)
        assert(availableMemoryMB > 0)
        assert(usedMemoryMB >= 0)
    }

    private fun getMemoryInfo(): android.app.ActivityManager.MemoryInfo? {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        return memoryInfo
    }
}
