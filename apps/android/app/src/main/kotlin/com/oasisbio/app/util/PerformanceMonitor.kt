package com.oasisbio.app.util

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Debug
import android.os.SystemClock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max

data class PerformanceMetric(
    val timestamp: Long = System.currentTimeMillis(),
    val type: MetricType,
    val name: String,
    val durationMs: Long = 0L,
    val value: Double = 0.0,
    val metadata: Map<String, String> = emptyMap()
)

enum class MetricType {
    APP_STARTUP,
    API_RESPONSE,
    MEMORY_USAGE,
    FRAME_RATE,
    SLOW_OPERATION,
    CUSTOM
}

data class SlowOperationAlert(
    val timestamp: Long,
    val operationName: String,
    val durationMs: Long,
    val thresholdMs: Long,
    val metricType: MetricType
)

data class PerformanceThresholds(
    val appStartupMs: Long = 2000L,
    val apiResponseMs: Long = 3000L,
    val memoryUsagePercent: Float = 80f,
    val frameRateFps: Float = 30f,
    val slowOperationMs: Long = 500L,
    val memorySamplingIntervalMs: Long = 5000L,
    val fpsSamplingIntervalMs: Long = 1000L,
    val gcMonitoringEnabled: Boolean = true,
    val leakCanaryEnabled: Boolean = true
)

class PerformanceMonitor private constructor(
    private val context: Context,
    private val thresholds: PerformanceThresholds = PerformanceThresholds()
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val metrics = mutableListOf<PerformanceMetric>()
    private val metricsJob: Job? = null

    private val _metricsFlow = MutableSharedFlow<PerformanceMetric>(extraBufferCapacity = 100)
    val metricsFlow: SharedFlow<PerformanceMetric> = _metricsFlow.asSharedFlow()

    private val _slowOperationAlertsFlow = MutableSharedFlow<SlowOperationAlert>(extraBufferCapacity = 50)
    val slowOperationAlertsFlow: SharedFlow<SlowOperationAlert> = _slowOperationAlertsFlow.asSharedFlow()

    private val _currentMemoryUsage = MutableStateFlow(MemoryUsage(0L, 0L, 0f))
    val currentMemoryUsage: StateFlow<MemoryUsage> = _currentMemoryUsage.asStateFlow()

    private val _currentFps = MutableStateFlow(0f)
    val currentFps: StateFlow<Float> = _currentFps.asStateFlow()

    private val _gcEvents = MutableStateFlow<List<GcEvent>>(emptyList())
    val gcEvents: StateFlow<List<GcEvent>> = _gcEvents.asStateFlow()

    private val _memorySnapshot = MutableStateFlow<MemorySnapshot?>(null)
    val memorySnapshot: StateFlow<MemorySnapshot?> = _memorySnapshot.asStateFlow()

    private val _leakCanaryEnabled = MutableStateFlow(false)
    val leakCanaryEnabled: StateFlow<Boolean> = _leakCanaryEnabled.asStateFlow()

    private var lastGcStartTime = 0L

    private val _isMonitoring = MutableStateFlow(false)
    val isMonitoring: StateFlow<Boolean> = _isMonitoring.asStateFlow()

    private var memoryMonitorJob: Job? = null
    private var fpsMonitorJob: Job? = null

    private val startupTimers = mutableMapOf<String, Long>()
    private val operationTimers = mutableMapOf<String, OperationTimer>()

    private val activityManager: ActivityManager by lazy {
        context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    }

    private val memoryInfo = ActivityManager.MemoryInfo()

    data class MemoryUsage(val totalMemory: Long, val availableMemory: Long, val usagePercent: Float)
    data class OperationTimer(val startTime: Long, val tag: String)
    data class GcEvent(val timestamp: Long, val gcType: GcType, val durationMs: Long, val reclaimedBytes: Long)

    enum class GcType {
        YOUNG_GENERATION,
        OLD_GENERATION,
        FULL_GC,
        BACKGROUND_GC,
        SYSTEM_GC
    }

    data class MemorySnapshot(
        val timestamp: Long = System.currentTimeMillis(),
        val nativeMemory: Long,
        val javaHeapMemory: Long,
        val availableMemory: Long,
        val totalMemory: Long,
        val retainedMemory: Long,
        val gcEvents: List<GcEvent>
    )

    suspend fun generateReport(): PerformanceReport = withContext(Dispatchers.Default) {
        val currentTime = System.currentTimeMillis()
        val recentMetrics = metrics.filter { currentTime - it.timestamp < REPORT_WINDOW_MS }

        val groupedByType = recentMetrics.groupBy { it.type }

        val startupMetrics = groupedByType[MetricType.APP_STARTUP] ?: emptyList()
        val apiMetrics = groupedByType[MetricType.API_RESPONSE] ?: emptyList()
        val memoryMetrics = groupedByType[MetricType.MEMORY_USAGE] ?: emptyList()
        val fpsMetrics = groupedByType[MetricType.FRAME_RATE] ?: emptyList()
        val slowOps = groupedByType[MetricType.SLOW_OPERATION] ?: emptyList()
        val gcMetrics = _gcEvents.value

        PerformanceReport(
            generatedAt = currentTime,
            appStartupMetrics = calculateStats(startupMetrics),
            apiResponseMetrics = calculateStats(apiMetrics),
            memoryUsageMetrics = calculateStats(memoryMetrics),
            frameRateMetrics = calculateStats(fpsMetrics),
            slowOperations = slowOps.map { SlowOpInfo(it.name, it.durationMs, it.timestamp) },
            totalMetricsCollected = metrics.size,
            gcEvents = gcMetrics
        )
    }

    private fun calculateStats(metrics: List<PerformanceMetric>): MetricStats? {
        if (metrics.isEmpty()) return null
        val durations = metrics.map { it.durationMs.toDouble() }
        val values = metrics.map { it.value }
        return MetricStats(
            count = metrics.size,
            min = durations.minOrNull() ?: 0.0,
            max = durations.maxOrNull() ?: 0.0,
            avg = durations.average(),
            p50 = percentile(durations, 50.0),
            p90 = percentile(durations, 90.0),
            p95 = percentile(durations, 95.0),
            p99 = percentile(durations, 99.0),
            values = values
        )
    }

    private fun percentile(sortedValues: List<Double>, percentile: Double): Double {
        if (sortedValues.isEmpty()) return 0.0
        val sorted = sortedValues.sorted()
        val index = (percentile / 100.0 * (sorted.size - 1)).toInt()
        return sorted[max(0, minOf(index, sorted.size - 1))]
    }

    fun startTracking(tag: String) {
        startupTimers[tag] = SystemClock.elapsedRealtime()
    }

    fun stopTracking(tag: String): Long {
        val startTime = startupTimers.remove(tag) ?: return 0L
        val duration = SystemClock.elapsedRealtime() - startTime
        val metric = PerformanceMetric(
            type = MetricType.APP_STARTUP,
            name = tag,
            durationMs = duration
        )
        addMetric(metric)
        checkThresholdAndAlert(metric)
        return duration
    }

    fun startOperation(tag: String): Long {
        operationTimers[tag] = OperationTimer(SystemClock.elapsedRealtime(), tag)
        return SystemClock.elapsedRealtime()
    }

    fun <T> measureApiCall(tag: String, block: suspend () -> T): T {
        val startTime = SystemClock.elapsedRealtime()
        val result = kotlinx.coroutines.runBlocking {
            block()
        }
        val duration = SystemClock.elapsedRealtime() - startTime
        val metric = PerformanceMetric(
            type = MetricType.API_RESPONSE,
            name = tag,
            durationMs = duration
        )
        addMetric(metric)
        checkThresholdAndAlert(metric)
        return result
    }

    suspend fun <T> measureApiCallSuspend(tag: String, block: suspend () -> T): T {
        val startTime = SystemClock.elapsedRealtime()
        val result = block()
        val duration = SystemClock.elapsedRealtime() - startTime
        val metric = PerformanceMetric(
            type = MetricType.API_RESPONSE,
            name = tag,
            durationMs = duration
        )
        addMetric(metric)
        checkThresholdAndAlert(metric)
        return result
    }

    fun stopOperation(tag: String): Long {
        val timer = operationTimers.remove(tag) ?: return 0L
        val duration = SystemClock.elapsedRealtime() - timer.startTime
        val metric = PerformanceMetric(
            type = MetricType.CUSTOM,
            name = tag,
            durationMs = duration
        )
        addMetric(metric)
        checkThresholdAndAlert(metric)
        return duration
    }

    fun recordCustomMetric(name: String, value: Double, metadata: Map<String, String> = emptyMap()) {
        val metric = PerformanceMetric(
            type = MetricType.CUSTOM,
            name = name,
            value = value,
            metadata = metadata
        )
        addMetric(metric)
    }

    private fun checkThresholdAndAlert(metric: PerformanceMetric) {
        val alert = when (metric.type) {
            MetricType.APP_STARTUP -> {
                if (metric.durationMs > thresholds.appStartupMs) {
                    SlowOperationAlert(
                        timestamp = metric.timestamp,
                        operationName = metric.name,
                        durationMs = metric.durationMs,
                        thresholdMs = thresholds.appStartupMs,
                        metricType = metric.type
                    )
                } else null
            }
            MetricType.API_RESPONSE -> {
                if (metric.durationMs > thresholds.apiResponseMs) {
                    SlowOperationAlert(
                        timestamp = metric.timestamp,
                        operationName = metric.name,
                        durationMs = metric.durationMs,
                        thresholdMs = thresholds.apiResponseMs,
                        metricType = metric.type
                    )
                } else null
            }
            MetricType.CUSTOM -> {
                if (metric.durationMs > thresholds.slowOperationMs) {
                    SlowOperationAlert(
                        timestamp = metric.timestamp,
                        operationName = metric.name,
                        durationMs = metric.durationMs,
                        thresholdMs = thresholds.slowOperationMs,
                        metricType = metric.type
                    )
                } else null
            }
            else -> null
        }
        alert?.let {
            scope.launch {
                _slowOperationAlertsFlow.emit(it)
            }
        }
    }

    fun startMonitoring() {
        if (_isMonitoring.value) return
        _isMonitoring.value = true
        startMemoryMonitoring()
        startFpsMonitoring()
    }

    fun stopMonitoring() {
        _isMonitoring.value = false
        memoryMonitorJob?.cancel()
        memoryMonitorJob = null
        fpsMonitorJob?.cancel()
        fpsMonitorJob = null
    }

    fun startGcMonitoring() {
        if (!thresholds.gcMonitoringEnabled) return
        lastGcStartTime = System.nanoTime()
    }

    fun recordGcEvent(gcType: GcType, durationMs: Long, reclaimedBytes: Long) {
        if (!thresholds.gcMonitoringEnabled) return

        val event = GcEvent(
            timestamp = System.currentTimeMillis(),
            gcType = gcType,
            durationMs = durationMs,
            reclaimedBytes = reclaimedBytes
        )

        val currentEvents = _gcEvents.value.toMutableList()
        currentEvents.add(event)
        if (currentEvents.size > MAX_GC_EVENTS_STORED) {
            currentEvents.removeAt(0)
        }
        _gcEvents.value = currentEvents

        if (durationMs > GC_THRESHOLD_MS) {
            scope.launch {
                _slowOperationAlertsFlow.emit(
                    SlowOperationAlert(
                        timestamp = event.timestamp,
                        operationName = "Long GC: ${gcType.name}",
                        durationMs = durationMs,
                        thresholdMs = GC_THRESHOLD_MS,
                        metricType = MetricType.MEMORY_USAGE
                    )
                )
            }
        }
    }

    fun captureMemorySnapshot(): MemorySnapshot {
        val runtime = Runtime.getRuntime()
        val nativeMemory = Debug.getNativeHeapAllocatedSize()
        val javaHeapMemory = runtime.totalMemory() - runtime.freeMemory()
        val availableMemory = runtime.freeMemory()
        val totalMemory = runtime.totalMemory()

        activityManager.getMemoryInfo(memoryInfo)

        val snapshot = MemorySnapshot(
            timestamp = System.currentTimeMillis(),
            nativeMemory = nativeMemory,
            javaHeapMemory = javaHeapMemory,
            availableMemory = availableMemory + memoryInfo.availMem,
            totalMemory = totalMemory + memoryInfo.totalMem - runtime.totalMemory(),
            retainedMemory = calculateRetainedMemory(),
            gcEvents = _gcEvents.value
        )

        _memorySnapshot.value = snapshot
        return snapshot
    }

    private fun calculateRetainedMemory(): Long {
        val runtime = Runtime.getRuntime()
        return runtime.totalMemory() - runtime.freeMemory()
    }

    fun getDetailedMemoryInfo(): DetailedMemoryInfo {
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory()
        val totalMemory = runtime.totalMemory()
        val freeMemory = runtime.freeMemory()
        val usedMemory = totalMemory - freeMemory

        activityManager.getMemoryInfo(memoryInfo)

        return DetailedMemoryInfo(
            runtimeMaxMemory = maxMemory,
            runtimeTotalMemory = totalMemory,
            runtimeFreeMemory = freeMemory,
            runtimeUsedMemory = usedMemory,
            nativeHeapAllocated = Debug.getNativeHeapAllocatedSize(),
            nativeHeapSize = Debug.getNativeHeapSize(),
            deviceTotalMemory = memoryInfo.totalMem,
            deviceAvailableMemory = memoryInfo.availMem,
            isLowMemoryDevice = memoryInfo.lowMemory,
            memoryClass = getMemoryClass(),
            largeMemoryClass = getLargeMemoryClass()
        )
    }

    private fun getMemoryClass(): Int {
        return try {
            activityManager.memoryClass
        } catch (e: Exception) {
            128
        }
    }

    private fun getLargeMemoryClass(): Int {
        return try {
            activityManager.largeMemoryClass
        } catch (e: Exception) {
            256
        }
    }

    fun enableLeakCanaryIntegration() {
        _leakCanaryEnabled.value = true
    }

    fun disableLeakCanaryIntegration() {
        _leakCanaryEnabled.value = false
    }

    private fun startMemoryMonitoring() {
        memoryMonitorJob = scope.launch {
            while (isActive && _isMonitoring.value) {
                val memoryUsage = getCurrentMemoryUsage()
                _currentMemoryUsage.value = memoryUsage

                val metric = PerformanceMetric(
                    type = MetricType.MEMORY_USAGE,
                    name = "memory_usage",
                    durationMs = 0,
                    value = memoryUsage.usagePercent.toDouble(),
                    metadata = mapOf(
                        "total" to formatBytes(memoryUsage.totalMemory),
                        "available" to formatBytes(memoryUsage.availableMemory)
                    )
                )
                addMetric(metric)

                if (memoryUsage.usagePercent > thresholds.memoryUsagePercent) {
                    _slowOperationAlertsFlow.emit(
                        SlowOperationAlert(
                            timestamp = System.currentTimeMillis(),
                            operationName = "High Memory Usage",
                            durationMs = 0,
                            thresholdMs = thresholds.memoryUsagePercent.toLong(),
                            metricType = MetricType.MEMORY_USAGE
                        )
                    )
                }
                delay(thresholds.memorySamplingIntervalMs)
            }
        }
    }

    private fun startFpsMonitoring() {
        fpsMonitorJob = scope.launch {
            var lastFrameTime = System.nanoTime()
            var frameCount = 0
            var fpsAccumulator = 0f
            var sampleCount = 0

            while (isActive && _isMonitoring.value) {
                delay(thresholds.fpsSamplingIntervalMs)
                val currentTime = System.nanoTime()
                frameCount++
                val deltaTime = (currentTime - lastFrameTime) / 1_000_000_000f
                lastFrameTime = currentTime

                if (deltaTime > 0) {
                    fpsAccumulator += (frameCount / deltaTime)
                    sampleCount++
                    val currentFps = fpsAccumulator / sampleCount
                    _currentFps.value = currentFps

                    val metric = PerformanceMetric(
                        type = MetricType.FRAME_RATE,
                        name = "fps",
                        value = currentFps.toDouble()
                    )
                    addMetric(metric)

                    if (currentFps < thresholds.frameRateFps) {
                        _slowOperationAlertsFlow.emit(
                            SlowOperationAlert(
                                timestamp = System.currentTimeMillis(),
                                operationName = "Low Frame Rate",
                                durationMs = 0,
                                thresholdMs = thresholds.frameRateFps.toLong(),
                                metricType = MetricType.FRAME_RATE
                            )
                        )
                    }
                }
                frameCount = 0
            }
        }
    }

    private fun getCurrentMemoryUsage(): MemoryUsage {
        activityManager.getMemoryInfo(memoryInfo)
        val totalMemory = memoryInfo.totalMem
        val availableMemory = memoryInfo.availMem
        val usagePercent = ((totalMemory - availableMemory).toFloat() / totalMemory) * 100f
        return MemoryUsage(totalMemory, availableMemory, usagePercent)
    }

    private fun addMetric(metric: PerformanceMetric) {
        metrics.add(metric)
        scope.launch {
            _metricsFlow.emit(metric)
        }
        if (metrics.size > MAX_METRICS_STORED) {
            metrics.removeAt(0)
        }
    }

    private fun formatBytes(bytes: Long): String {
        val kb = bytes / 1024.0
        val mb = kb / 1024.0
        val gb = mb / 1024.0
        return when {
            gb >= 1 -> String.format(Locale.US, "%.2f GB", gb)
            mb >= 1 -> String.format(Locale.US, "%.2f MB", mb)
            kb >= 1 -> String.format(Locale.US, "%.2f KB", kb)
            else -> "$bytes B"
        }
    }

    fun clearMetrics() {
        metrics.clear()
    }

    companion object {
        private const val MAX_METRICS_STORED = 1000
        private const val REPORT_WINDOW_MS = 60 * 60 * 1000L
        private const val MAX_GC_EVENTS_STORED = 50
        private const val GC_THRESHOLD_MS = 50L

        @Volatile
        private var instance: PerformanceMonitor? = null

        fun getInstance(context: Context, thresholds: PerformanceThresholds = PerformanceThresholds()): PerformanceMonitor {
            return instance ?: synchronized(this) {
                instance ?: PerformanceMonitor(context.applicationContext, thresholds).also { instance = it }
            }
        }
    }
}

data class MetricStats(
    val count: Int,
    val min: Double,
    val max: Double,
    val avg: Double,
    val p50: Double,
    val p90: Double,
    val p95: Double,
    val p99: Double,
    val values: List<Double>
)

data class SlowOpInfo(
    val name: String,
    val durationMs: Long,
    val timestamp: Long
)

data class DetailedMemoryInfo(
    val runtimeMaxMemory: Long,
    val runtimeTotalMemory: Long,
    val runtimeFreeMemory: Long,
    val runtimeUsedMemory: Long,
    val nativeHeapAllocated: Long,
    val nativeHeapSize: Long,
    val deviceTotalMemory: Long,
    val deviceAvailableMemory: Long,
    val isLowMemoryDevice: Boolean,
    val memoryClass: Int,
    val largeMemoryClass: Int
) {
    val heapUsagePercent: Float
        get() = if (runtimeMaxMemory > 0) {
            (runtimeUsedMemory.toFloat() / runtimeMaxMemory) * 100f
        } else 0f

    val nativeHeapUsagePercent: Float
        get() = if (nativeHeapSize > 0) {
            (nativeHeapAllocated.toFloat() / nativeHeapSize) * 100f
        } else 0f

    fun toFormattedString(): String {
        return buildString {
            appendLine("=== Detailed Memory Info ===")
            appendLine("Java Heap:")
            appendLine("  Max: ${formatBytes(runtimeMaxMemory)}")
            appendLine("  Total: ${formatBytes(runtimeTotalMemory)}")
            appendLine("  Used: ${formatBytes(runtimeUsedMemory)}")
            appendLine("  Free: ${formatBytes(runtimeFreeMemory)}")
            appendLine("  Usage: ${String.format("%.1f", heapUsagePercent)}%")
            appendLine("Native Heap:")
            appendLine("  Allocated: ${formatBytes(nativeHeapAllocated)}")
            appendLine("  Size: ${formatBytes(nativeHeapSize)}")
            appendLine("  Usage: ${String.format("%.1f", nativeHeapUsagePercent)}%")
            appendLine("Device Memory:")
            appendLine("  Total: ${formatBytes(deviceTotalMemory)}")
            appendLine("  Available: ${formatBytes(deviceAvailableMemory)}")
            appendLine("  Low Memory: $isLowMemoryDevice")
            appendLine("Memory Classes:")
            appendLine("  Standard: ${memoryClass}MB")
            appendLine("  Large: ${largeMemoryClass}MB")
        }
    }

    private fun formatBytes(bytes: Long): String {
        val kb = bytes / 1024.0
        val mb = kb / 1024.0
        val gb = mb / 1024.0
        return when {
            gb >= 1 -> String.format(Locale.US, "%.2f GB", gb)
            mb >= 1 -> String.format(Locale.US, "%.2f MB", mb)
            kb >= 1 -> String.format(Locale.US, "%.2f KB", kb)
            else -> "$bytes B"
        }
    }
}

data class PerformanceReport(
    val generatedAt: Long,
    val appStartupMetrics: MetricStats?,
    val apiResponseMetrics: MetricStats?,
    val memoryUsageMetrics: MetricStats?,
    val frameRateMetrics: MetricStats?,
    val slowOperations: List<SlowOpInfo>,
    val totalMetricsCollected: Int,
    val gcEvents: List<GcEvent> = emptyList()
) {
    fun toFormattedString(): String {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val sb = StringBuilder()
        sb.appendLine("=== Performance Report ===")
        sb.appendLine("Generated: ${dateFormat.format(Date(generatedAt))}")
        sb.appendLine("Total Metrics: $totalMetricsCollected")
        sb.appendLine()

        appStartupMetrics?.let { stats ->
            sb.appendLine("-- App Startup (ms) --")
            appendStats(sb, stats)
        }

        apiResponseMetrics?.let { stats ->
            sb.appendLine("-- API Response (ms) --")
            appendStats(sb, stats)
        }

        memoryUsageMetrics?.let { stats ->
            sb.appendLine("-- Memory Usage (%) --")
            appendStats(sb, stats)
        }

        frameRateMetrics?.let { stats ->
            sb.appendLine("-- Frame Rate (fps) --")
            appendStats(sb, stats)
        }

        if (slowOperations.isNotEmpty()) {
            sb.appendLine("-- Slow Operations (${slowOperations.size}) --")
            slowOperations.take(10).forEach { op ->
                sb.appendLine("  ${op.name}: ${op.durationMs}ms @ ${dateFormat.format(Date(op.timestamp))}")
            }
        }

        if (gcEvents.isNotEmpty()) {
            sb.appendLine("-- GC Events (${gcEvents.size}) --")
            val totalGcDuration = gcEvents.sumOf { it.durationMs }
            val totalReclaimed = gcEvents.sumOf { it.reclaimedBytes }
            sb.appendLine("  Total Duration: ${totalGcDuration}ms")
            sb.appendLine("  Total Reclaimed: ${formatBytes(totalReclaimed)}")
            gcEvents.takeLast(5).forEach { event ->
                sb.appendLine("  ${event.gcType}: ${event.durationMs}ms @ ${dateFormat.format(Date(event.timestamp))}")
            }
        }

        return sb.toString()
    }

    private fun appendStats(sb: StringBuilder, stats: MetricStats) {
        sb.appendLine("  Count: ${stats.count}")
        sb.appendLine("  Min: ${String.format(Locale.US, "%.2f", stats.min)}")
        sb.appendLine("  Max: ${String.format(Locale.US, "%.2f", stats.max)}")
        sb.appendLine("  Avg: ${String.format(Locale.US, "%.2f", stats.avg)}")
        sb.appendLine("  P50: ${String.format(Locale.US, "%.2f", stats.p50)}")
        sb.appendLine("  P90: ${String.format(Locale.US, "%.2f", stats.p90)}")
        sb.appendLine("  P95: ${String.format(Locale.US, "%.2f", stats.p95)}")
        sb.appendLine("  P99: ${String.format(Locale.US, "%.2f", stats.p99)}")
        sb.appendLine()
    }
}
