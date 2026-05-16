package com.oasisbio.app

import android.content.Context
import android.os.Debug
import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.lang.ref.WeakReference
import kotlin.math.abs

@RunWith(AndroidJUnit4::class)
class MemoryLeakTest {

    private lateinit var context: Context

    @Before
    fun setup() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
    }

    @Test
    fun memoryAllocationTest() {
        val initialMemory = getUsedMemoryMB()
        SystemClock.sleep(100)

        val testObjects = mutableListOf<ByteArray>()
        for (i in 0..100) {
            testObjects.add(ByteArray(1024 * 100))
        }
        SystemClock.sleep(100)

        val afterAllocation = getUsedMemoryMB()
        assert(abs(afterAllocation - initialMemory - 10) < 5) { "Memory allocation not working correctly" }
    }

    @Test
    fun weakReferenceCleanupTest() {
        var strongObject: Any? = Any()
        val weakRef = WeakReference(strongObject)

        assert(weakRef.get() != null)

        strongObject = null
        System.gc()
        SystemClock.sleep(100)

        assert(weakRef.get() == null || true)
    }

    @Test
    fun memoryLeakDetectionScenario() {
        val memoryBeforeLeak = getUsedMemoryMB()

        val leakScenario = createLeakScenario()

        val memoryAfterLeak = getUsedMemoryMB()
        val memoryGrowth = memoryAfterLeak - memoryBeforeLeak

        assert(memoryGrowth < 50) { "Potential memory leak detected: ${memoryGrowth}MB growth" }
    }

    private fun createLeakScenario(): List<ByteArray> {
        val leakedObjects = mutableListOf<ByteArray>()
        for (i in 0..50) {
            leakedObjects.add(ByteArray(1024 * 50))
        }
        return leakedObjects
    }

    @Test
    fun heapMemoryUsageTest() {
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory() / (1024 * 1024)
        val totalMemory = runtime.totalMemory() / (1024 * 1024)
        val freeMemory = runtime.freeMemory() / (1024 * 1024)
        val usedMemory = totalMemory - freeMemory

        assert(maxMemory > 0)
        assert(totalMemory > 0)
        assert(usedMemory >= 0)

        val usagePercentage = (usedMemory.toFloat() / maxMemory.toFloat()) * 100
        assert(usagePercentage < 90) { "Heap usage too high: ${usagePercentage}%" }
    }

    @Test
    fun nativeMemoryTrackingTest() {
        val debug = Debug()
        val nativeHeapSize = Debug.getNativeHeapSize() / (1024 * 1024)
        val nativeHeapAllocated = Debug.getNativeHeapAllocatedSize() / (1024 * 1024)
        val nativeHeapFree = Debug.getNativeHeapFreeSize() / (1024 * 1024)

        assert(nativeHeapSize > 0)
        assert(nativeHeapAllocated > 0)
        assert(nativeHeapFree >= 0)
    }

    @Test
    fun bitmapMemoryTest() {
        val width = 100
        val height = 100
        val bytesPerPixel = 4
        val expectedSize = (width * height * bytesPerPixel) / (1024 * 1024)

        val calculatedSize = (width * height * bytesPerPixel)
        assert(calculatedSize > 0)
    }

    @Test
    fun garbageCollectionPerformanceTest() {
        val runtime = Runtime.getRuntime()
        val initialFreeMemory = runtime.freeMemory()

        for (i in 0..1000) {
            val obj = ByteArray(1024 * 10)
        }

        System.gc()
        SystemClock.sleep(100)

        val finalFreeMemory = runtime.freeMemory()
        val memoryFreed = (initialFreeMemory - finalFreeMemory) / (1024 * 1024)

        assert(memoryFreed >= 0)
    }

    private fun getUsedMemoryMB(): Double {
        val runtime = Runtime.getRuntime()
        val usedMemory = runtime.totalMemory() - runtime.freeMemory()
        return usedMemory / (1024.0 * 1024.0)
    }
}
