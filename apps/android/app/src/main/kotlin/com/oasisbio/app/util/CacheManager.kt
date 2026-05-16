package com.oasisbio.app.util

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.os.Build
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import kotlin.collections.HashMap
import kotlin.collections.component1
import kotlin.collections.component2

class CacheManager private constructor(private val context: Context) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val caches = ConcurrentHashMap<String, CacheEntry<*>>()
    private val cacheMetadata = ConcurrentHashMap<String, CacheMetadata>()

    private val _memoryPressureLevel = MutableStateFlow(MemoryPressureLevel.NORMAL)
    val memoryPressureLevel: StateFlow<MemoryPressureLevel> = _memoryPressureLevel.asStateFlow()

    private val _totalCacheSize = AtomicLong(0)
    val totalCacheSize: Long get() = _totalCacheSize.get()

    private val activityManager: ActivityManager by lazy {
        context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    }

    private val memoryInfo = ActivityManager.MemoryInfo()

    private val cleanupRunnable = object : Runnable {
        override fun run() {
            scope.launch {
                performScheduledCleanup()
            }
        }
    }

    init {
        registerComponentCallbacks()
        calculateAvailableMemory()
    }

    private fun registerComponentCallbacks() {
        context.registerComponentCallback(object : ComponentCallbacks2 {
            override fun onTrimMemory(level: Int) {
                handleTrimMemory(level)
            }

            override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {}

            override fun onLowMemory() {
                handleLowMemory()
            }
        })
    }

    private fun handleTrimMemory(level: Int) {
        when {
            level >= ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                clearAllCaches()
                _memoryPressureLevel.value = MemoryPressureLevel.CRITICAL
            }
            level >= ComponentCallbacks2.TRIM_MEMORY_MODERATE -> {
                clearLeastRecentlyUsedCaches(0.5)
                _memoryPressureLevel.value = MemoryPressureLevel.HIGH
            }
            level >= ComponentCallbacks2.TRIM_MEMORY_BACKGROUND -> {
                clearExpiredEntries()
                _memoryPressureLevel.value = MemoryPressureLevel.MEDIUM
            }
            level >= ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN -> {
                clearLeastRecentlyUsedCaches(0.3)
                _memoryPressureLevel.value = MemoryPressureLevel.LOW
            }
        }
    }

    private fun handleLowMemory() {
        clearAllCaches()
        _memoryPressureLevel.value = MemoryPressureLevel.CRITICAL
        Timber.w("CacheManager: Low memory detected, cleared all caches")
    }

    fun <T> getOrCreate(
        key: String,
        cacheName: String = DEFAULT_CACHE,
        maxSize: Int = DEFAULT_MAX_SIZE,
        ttlMillis: Long = DEFAULT_TTL_MILLIS,
        factory: () -> T
    ): T {
        val cacheKey = "$cacheName:$key"
        val entry = caches[cacheKey]

        if (entry != null && !entry.isExpired()) {
            @Suppress("UNCHECKED_CAST")
            val typedEntry = entry as CacheEntry<T>
            typedEntry.updateAccess()
            cacheMetadata[cacheKey]?.incrementHits()
            return typedEntry.value
        }

        val newValue = factory()
        put(cacheKey, newValue, ttlMillis)
        cacheMetadata.getOrPut(cacheKey) { CacheMetadata(cacheKey) }.incrementMisses()

        return newValue
    }

    fun <T> put(key: String, value: T, ttlMillis: Long = DEFAULT_TTL_MILLIS) {
        val entry = CacheEntry(value, System.currentTimeMillis() + ttlMillis)
        val previousEntry = caches.put(key, entry)

        if (previousEntry != null) {
            _totalCacheSize.addAndGet(-calculateEntrySize(previousEntry))
        }

        _totalCacheSize.addAndGet(calculateEntrySize(entry))
        cacheMetadata.getOrPut(key) { CacheMetadata(key) }

        enforceMaxSize(key.substringBefore(":"))
        evictExpiredEntries()
    }

    @Suppress("UNCHECKED_CAST")
    fun <T> get(key: String): T? {
        val entry = caches[key] as? CacheEntry<T> ?: return null

        if (entry.isExpired()) {
            remove(key)
            return null
        }

        entry.updateAccess()
        cacheMetadata[key]?.incrementHits()
        return entry.value
    }

    fun remove(key: String) {
        val entry = caches.remove(key)
        if (entry != null) {
            _totalCacheSize.addAndGet(-calculateEntrySize(entry))
            cacheMetadata.remove(key)
        }
    }

    fun removeByPrefix(cacheName: String) {
        val prefix = "$cacheName:"
        caches.keys.toList().filter { it.startsWith(prefix) }.forEach { key ->
            remove(key)
        }
    }

    fun clearAllCaches() {
        caches.clear()
        cacheMetadata.clear()
        _totalCacheSize.set(0)
    }

    fun clearAllCachesExcept(vararg cacheNames: String) {
        val allowedPrefixes = cacheNames.map { "$it:" }
        caches.keys.toList().filter { key ->
            allowedPrefixes.none { key.startsWith(it) }
        }.forEach { key ->
            remove(key)
        }
    }

    private fun evictExpiredEntries() {
        val currentTime = System.currentTimeMillis()
        caches.entries.toList()
            .filter { it.value.expiresAt < currentTime }
            .forEach { (key, entry) ->
                caches.remove(key)
                _totalCacheSize.addAndGet(-calculateEntrySize(entry))
                cacheMetadata.remove(key)
            }
    }

    private fun performScheduledCleanup() {
        evictExpiredEntries()
        calculateAvailableMemory()
    }

    private fun clearLeastRecentlyUsedCaches(percentage: Double) {
        val sortedEntries = caches.entries
            .sortedBy { it.value.lastAccessTime }
            .take((caches.size * percentage).toInt().coerceAtLeast(1))

        sortedEntries.forEach { (key, entry) ->
            caches.remove(key)
            _totalCacheSize.addAndGet(-calculateEntrySize(entry))
            cacheMetadata.remove(key)
        }
    }

    private fun clearExpiredEntries() {
        evictExpiredEntries()
    }

    private fun enforceMaxSize(cacheName: String) {
        val prefix = "$cacheName:"
        val cacheEntries = caches.entries.filter { it.key.startsWith(prefix) }

        if (cacheEntries.size > MAX_ENTRIES_PER_CACHE) {
            val sortedByAccess = cacheEntries.sortedBy { it.value.lastAccessTime }
            val toRemove = sortedByAccess.take(cacheEntries.size - MAX_ENTRIES_PER_CACHE)

            toRemove.forEach { (key, entry) ->
                caches.remove(key)
                _totalCacheSize.addAndGet(-calculateEntrySize(entry))
                cacheMetadata.remove(key)
            }
        }

        val totalSize = calculateTotalCacheSize()
        if (totalSize > MAX_TOTAL_CACHE_SIZE) {
            clearLeastRecentlyUsedCaches(0.2)
        }
    }

    private fun calculateTotalCacheSize(): Long {
        return caches.values.sumOf { calculateEntrySize(it) }
    }

    private fun calculateEntrySize(entry: CacheEntry<*>): Long {
        return when (val value = entry.value) {
            is String -> value.length.toLong() * 2
            is ByteArray -> value.size.toLong()
            is Collection<*> -> value.size.toLong() * 8
            is Map<*, *> -> value.size.toLong() * 16
            else -> 64
        }
    }

    private fun calculateAvailableMemory() {
        activityManager.getMemoryInfo(memoryInfo)
        val availableMB = memoryInfo.availMem / (1024 * 1024)
        val totalMB = memoryInfo.totalMem / (1024 * 1024)
        val usagePercent = ((memoryInfo.totalMem - memoryInfo.availMem).toFloat() / memoryInfo.totalMem) * 100

        _memoryPressureLevel.value = when {
            usagePercent > 90 -> MemoryPressureLevel.CRITICAL
            usagePercent > 75 -> MemoryPressureLevel.HIGH
            usagePercent > 60 -> MemoryPressureLevel.MEDIUM
            usagePercent > 45 -> MemoryPressureLevel.LOW
            else -> MemoryPressureLevel.NORMAL
        }
    }

    fun getCacheStats(): CacheStats {
        val stats = cacheMetadata.values.toList()
        val totalHits = stats.sumOf { it.hits }
        val totalMisses = stats.sumOf { it.misses }

        return CacheStats(
            totalEntries = caches.size,
            totalSizeBytes = _totalCacheSize.get(),
            totalHits = totalHits,
            totalMisses = totalMisses,
            hitRate = if (totalHits + totalMisses > 0)
                totalHits.toFloat() / (totalHits + totalMisses) * 100 else 0f,
            memoryPressureLevel = _memoryPressureLevel.value
        )
    }

    fun getCacheNames(): List<String> {
        return caches.keys
            .map { it.substringBefore(":") }
            .distinct()
            .sorted()
    }

    fun getCacheEntryCount(cacheName: String): Int {
        val prefix = "$cacheName:"
        return caches.keys.count { it.startsWith(prefix) }
    }

    companion object {
        const val DEFAULT_CACHE = "default"
        const val DEFAULT_MAX_SIZE = 100
        const val DEFAULT_TTL_MILLIS = 5 * 60 * 1000L
        const val MAX_ENTRIES_PER_CACHE = 500
        const val MAX_TOTAL_CACHE_SIZE = 50 * 1024 * 1024L

        @Volatile
        private var instance: CacheManager? = null

        fun getInstance(context: Context): CacheManager {
            return instance ?: synchronized(this) {
                instance ?: CacheManager(context.applicationContext).also { instance = it }
            }
        }
    }
}

data class CacheEntry<T>(
    val value: T,
    val expiresAt: Long,
    var lastAccessTime: Long = System.currentTimeMillis(),
    var accessCount: Int = 0
) {
    fun isExpired(): Boolean = System.currentTimeMillis() > expiresAt

    fun updateAccess() {
        lastAccessTime = System.currentTimeMillis()
        accessCount++
    }
}

data class CacheMetadata(
    val key: String,
    var hits: Long = 0,
    var misses: Long = 0,
    var lastUpdated: Long = System.currentTimeMillis()
) {
    fun incrementHits() {
        hits++
    }

    fun incrementMisses() {
        misses++
    }
}

data class CacheStats(
    val totalEntries: Int,
    val totalSizeBytes: Long,
    val totalHits: Long,
    val totalMisses: Long,
    val hitRate: Float,
    val memoryPressureLevel: MemoryPressureLevel
) {
    fun toFormattedString(): String {
        return buildString {
            appendLine("=== Cache Stats ===")
            appendLine("Total Entries: $totalEntries")
            appendLine("Total Size: ${formatBytes(totalSizeBytes)}")
            appendLine("Hits: $totalHits")
            appendLine("Misses: $totalMisses")
            appendLine("Hit Rate: ${String.format("%.2f", hitRate)}%")
            appendLine("Memory Pressure: $memoryPressureLevel")
        }
    }

    private fun formatBytes(bytes: Long): String {
        val kb = bytes / 1024.0
        val mb = kb / 1024.0
        return when {
            mb >= 1 -> String.format("%.2f MB", mb)
            kb >= 1 -> String.format("%.2f KB", kb)
            else -> "$bytes B"
        }
    }
}

enum class MemoryPressureLevel {
    NORMAL,
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

class LruCache<K : Any, V : Any>(
    private val maxSize: Int,
    private val onEvict: ((K, V) -> Unit)? = null
) {
    private val cache = LinkedHashMap<K, V>(maxSize, 0.75f, true)
    private val lock = Any()

    val size: Int
        get = synchronized(lock) { cache.size }

    fun get(key: K): V? {
        synchronized(lock) {
            return cache[key]?.also {
                cache.remove(key)
                cache[key] = it
            }
        }
    }

    fun put(key: K, value: V): V? {
        synchronized(lock) {
            val previous = cache.put(key, value)
            if (previous != null && previous !== value) {
                onEvict?.invoke(key, previous)
            }
            trimToSize(maxSize)
            return previous
        }
    }

    fun remove(key: K): V? {
        synchronized(lock) {
            return cache.remove(key)?.also {
                onEvict?.invoke(key, it)
            }
        }
    }

    fun clear() {
        synchronized(lock) {
            if (onEvict != null) {
                cache.forEach { (key, value) -> onEvict.invoke(key, value) }
            }
            cache.clear()
        }
    }

    fun contains(key: K): Boolean {
        synchronized(lock) {
            return cache.containsKey(key)
        }
    }

    fun snapshot(): Map<K, V> {
        synchronized(lock) {
            return cache.toMap()
        }
    }

    private fun trimToSize(maxSize: Int) {
        var currentSize = cache.size
        while (currentSize > maxSize) {
            val eldest = cache.entries.iterator().next()
            val key = eldest.key
            val value = eldest.value
            cache.remove(key)
            onEvict?.invoke(key, value)
            currentSize = cache.size
        }
    }
}
