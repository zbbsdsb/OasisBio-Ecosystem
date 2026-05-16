package com.oasisbio.app.di

import android.app.ActivityManager
import android.content.Context
import coil.ImageLoader
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.util.DebugLogger
import com.oasisbio.app.util.CacheManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ImageModule {

    private const val MEMORY_CACHE_PERCENT_LOW_DEVICE = 0.10
    private const val MEMORY_CACHE_PERCENT_HIGH_DEVICE = 0.20
    private const val DISK_CACHE_SIZE_MB_LOW_DEVICE = 50L
    private const val DISK_CACHE_SIZE_MB_HIGH_DEVICE = 100L

    @Provides
    @Singleton
    fun provideMemoryCache(@ApplicationContext context: Context): MemoryCache {
        val memoryClass = getMemoryClass(context)
        val percent = if (memoryClass >= 256) MEMORY_CACHE_PERCENT_HIGH_DEVICE else MEMORY_CACHE_PERCENT_LOW_DEVICE

        return MemoryCache.Builder(context)
            .maxSizePercent(percent)
            .strongReferencesEnabled(true)
            .weakReferencesEnabled(true)
            .build()
    }

    @Provides
    @Singleton
    fun provideDiskCache(@ApplicationContext context: Context): DiskCache {
        val memoryClass = getMemoryClass(context)
        val maxSizeBytes = if (memoryClass >= 256) {
            DISK_CACHE_SIZE_MB_HIGH_DEVICE * 1024 * 1024
        } else {
            DISK_CACHE_SIZE_MB_LOW_DEVICE * 1024 * 1024
        }

        return DiskCache.Builder()
            .directory(context.cacheDir.resolve("image_cache"))
            .maxSizeBytes(maxSizeBytes)
            .maxSizePercent(0.05)
            .build()
    }

    @Provides
    @Singleton
    fun provideOptimizedImageLoader(
        @ApplicationContext context: Context,
        memoryCache: MemoryCache,
        diskCache: DiskCache
    ): ImageLoader {
        return ImageLoader.Builder(context)
            .memoryCache {
                memoryCache
            }
            .diskCache {
                diskCache
            }
            .memoryCachePolicy(coil.request.CachePolicy.ENABLED)
            .diskCachePolicy(coil.request.CachePolicy.ENABLED)
            .respectCacheHeaders(false)
            .crossfade(true)
            .crossfade(250)
            .allowRgb565(true)
            .bitmapConfig(android.graphics.Bitmap.Config.ARGB_8888)
            .build()
    }

    @Provides
    @Singleton
    fun provideImageCacheManager(@ApplicationContext context: Context): ImageCacheManager {
        return ImageCacheManager(context)
    }

    private fun getMemoryClass(context: Context): Int {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return activityManager.memoryClass
    }
}

class ImageCacheManager(private val context: Context) {

    private val imageLoader: ImageLoader by lazy {
        ImageLoader.Builder(context)
            .memoryCache {
                MemoryCache.Builder(context)
                    .maxSizePercent(getMemoryCachePercent())
                    .strongReferencesEnabled(true)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(context.cacheDir.resolve("image_cache"))
                    .maxSizeBytes(getDiskCacheSizeBytes())
                    .build()
            }
            .build()
    }

    private val cacheManager: CacheManager by lazy {
        CacheManager.getInstance(context)
    }

    fun getImageLoader(): ImageLoader = imageLoader

    fun trimMemory(level: Int) {
        when {
            level >= android.content.ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                clearMemoryCache()
            }
            level >= android.content.ComponentCallbacks2.TRIM_MEMORY_MODERATE -> {
                imageLoader.memoryCache?.clear()
            }
            level >= android.content.ComponentCallbacks2.TRIM_MEMORY_BACKGROUND -> {
                imageLoader.memoryCache?.clear()
            }
        }

        if (level >= android.content.ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN) {
            imageLoader.diskCache?.clear()
        }
    }

    fun clearMemoryCache() {
        imageLoader.memoryCache?.clear()
    }

    fun clearDiskCache() {
        imageLoader.diskCache?.clear()
    }

    fun clearAllCaches() {
        clearMemoryCache()
        clearDiskCache()
    }

    fun getMemoryCacheStats(): MemoryCache.Stats? {
        return imageLoader.memoryCache?.stats()
    }

    fun getDiskCacheSize(): Long {
        return imageLoader.diskCache?.size ?: 0L
    }

    private fun getMemoryCachePercent(): Double {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return if (activityManager.memoryClass >= 256) {
            0.20
        } else {
            0.10
        }
    }

    private fun getDiskCacheSizeBytes(): Long {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return if (activityManager.memoryClass >= 256) {
            100L * 1024 * 1024
        } else {
            50L * 1024 * 1024
        }
    }

    fun getCacheStats(): ImageCacheStats {
        val memoryStats = getMemoryCacheStats()
        return ImageCacheStats(
            memoryCacheSize = memoryStats?.size ?: 0,
            memoryCacheMaxSize = memoryStats?.maxSize ?: 0,
            memoryCacheHitCount = memoryStats?.hitCount ?: 0,
            memoryCacheMissCount = memoryStats?.missCount ?: 0,
            diskCacheSize = getDiskCacheSize()
        )
    }
}

data class ImageCacheStats(
    val memoryCacheSize: Int,
    val memoryCacheMaxSize: Int,
    val memoryCacheHitCount: Int,
    val memoryCacheMissCount: Int,
    val diskCacheSize: Long
) {
    val memoryHitRate: Float
        get() = if (memoryCacheHitCount + memoryCacheMissCount > 0) {
            memoryCacheHitCount.toFloat() / (memoryCacheHitCount + memoryCacheMissCount) * 100
        } else 0f

    fun toFormattedString(): String {
        return buildString {
            appendLine("=== Image Cache Stats ===")
            appendLine("Memory Cache:")
            appendLine("  Size: ${formatBytes(memoryCacheSize.toLong())} / ${formatBytes(memoryCacheMaxSize.toLong())}")
            appendLine("  Hits: $memoryCacheHitCount")
            appendLine("  Misses: $memoryCacheMissCount")
            appendLine("  Hit Rate: ${String.format("%.2f", memoryHitRate)}%")
            appendLine("Disk Cache:")
            appendLine("  Size: ${formatBytes(diskCacheSize)}")
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
