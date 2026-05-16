package com.oasisbio.app.presentation.ui.components

import android.graphics.drawable.Drawable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BrokenImage
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import coil.ImageLoader
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import coil.compose.SubcomposeAsyncImage
import coil.compose.SubcomposeAsyncImageContent
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.request.CachePolicy
import coil.request.ImageRequest
import coil.size.Scale
import coil.size.Size
import com.oasisbio.app.util.PerformanceMonitor

object ImageLoaderFactory {
    private var imageLoader: ImageLoader? = null

    fun create(context: android.content.Context): ImageLoader {
        return imageLoader ?: ImageLoader.Builder(context)
            .memoryCache {
                MemoryCache.Builder(context)
                    .maxSizePercent(getMemoryCachePercent(context))
                    .strongReferencesEnabled(true)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(context.cacheDir.resolve("image_cache"))
                    .maxSizeBytes(getDiskCacheSizeBytes(context))
                    .build()
            }
            .diskCachePolicy(CachePolicy.ENABLED)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .respectCacheHeaders(false)
            .crossfade(true)
            .crossfade(250)
            .allowRgb565(true)
            .build()
            .also { imageLoader = it }
    }

    private fun getMemoryCachePercent(context: android.content.Context): Double {
        val activityManager = context.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        return if (activityManager.memoryClass >= 256) 0.20 else 0.10
    }

    private fun getDiskCacheSizeBytes(context: android.content.Context): Long {
        val activityManager = context.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        return if (activityManager.memoryClass >= 256) {
            100L * 1024 * 1024
        } else {
            50L * 1024 * 1024
        }
    }

    fun get(): ImageLoader? = imageLoader
}

enum class ImagePlaceholderType {
    NONE,
    SHIMMER,
    COLOR,
    ICON
}

@Composable
fun CachedAsyncImage(
    imageUrl: String?,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
    contentScale: ContentScale = ContentScale.Crop,
    placeholderType: ImagePlaceholderType = ImagePlaceholderType.SHIMMER,
    placeholderColor: Color = MaterialTheme.colorScheme.surfaceVariant,
    loadingPlaceholder: @Composable (() -> Unit)? = null,
    errorPlaceholder: @Composable (() -> Unit)? = null,
    onLoadingStarted: (() -> Unit)? = null,
    onLoadingFinished: (() -> Unit)? = null,
    onError: ((Throwable) -> Unit)? = null
) {
    val context = LocalContext.current
    val imageLoader = remember { ImageLoaderFactory.create(context) }
    var isLoading by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }
    var imageSize by remember { mutableStateOf(IntSize.Zero) }

    Box(
        modifier = modifier
            .onSizeChanged { imageSize = it },
        contentAlignment = Alignment.Center
    ) {
        when (placeholderType) {
            ImagePlaceholderType.SHIMMER -> {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(placeholderColor)
                )
            }
            ImagePlaceholderType.COLOR -> {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(placeholderColor)
                )
            }
            ImagePlaceholderType.ICON -> {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(placeholderColor),
                    contentAlignment = Alignment.Center
                ) {
                    if (loadingPlaceholder != null) {
                        loadingPlaceholder()
                    } else {
                        Icon(
                            imageVector = Icons.Default.Image,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            ImagePlaceholderType.NONE -> {}
        }

        if (imageUrl != null) {
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(imageUrl)
                    .crossfade(true)
                    .memoryCachePolicy(CachePolicy.ENABLED)
                    .diskCachePolicy(CachePolicy.ENABLED)
                    .size(Size.ORIGINAL)
                    .scale(Scale.FIT)
                    .build(),
                imageLoader = imageLoader,
                contentDescription = contentDescription,
                contentScale = contentScale,
                modifier = Modifier.fillMaxSize(),
                onState = { state ->
                    when (state) {
                        is AsyncImagePainter.State.Loading -> {
                            if (!isLoading) {
                                isLoading = true
                                onLoadingStarted?.invoke()
                            }
                        }
                        is AsyncImagePainter.State.Success -> {
                            if (isLoading || hasError) {
                                isLoading = false
                                hasError = false
                                onLoadingFinished?.invoke()
                            }
                        }
                        is AsyncImagePainter.State.Error -> {
                            isLoading = false
                            hasError = true
                            onError?.invoke(state.result.throwable)
                        }
                        is AsyncImagePainter.State.Empty -> {}
                    }
                }
            )
        }

        if (hasError) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(placeholderColor.copy(alpha = 0.8f)),
                contentAlignment = Alignment.Center
            ) {
                if (errorPlaceholder != null) {
                    errorPlaceholder()
                } else {
                    Icon(
                        imageVector = Icons.Default.BrokenImage,
                        contentDescription = "Image failed to load",
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun CachedImage(
    imageUrl: String,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
    contentScale: ContentScale = ContentScale.Crop,
    placeholderColor: Color = MaterialTheme.colorScheme.surfaceVariant,
    onSuccess: (() -> Unit)? = null,
    onError: ((Throwable) -> Unit)? = null
) {
    val context = LocalContext.current
    val imageLoader = remember { ImageLoaderFactory.create(context) }

    SubcomposeAsyncImage(
        model = ImageRequest.Builder(context)
            .data(imageUrl)
            .crossfade(true)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .diskCachePolicy(CachePolicy.ENABLED)
            .build(),
        imageLoader = imageLoader,
        contentDescription = contentDescription,
        contentScale = contentScale,
        modifier = modifier,
        loading = {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(placeholderColor),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    strokeWidth = 2.dp
                )
            }
        },
        error = {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(placeholderColor),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.BrokenImage,
                    contentDescription = "Image failed to load",
                    modifier = Modifier.size(32.dp),
                    tint = MaterialTheme.colorScheme.error
                )
            }
        },
        success = {
            SubcomposeAsyncImageContent()
            LaunchedEffect(Unit) {
                onSuccess?.invoke()
            }
        }
    )
}

@Composable
fun LazyLoadedImageList(
    imageUrls: List<String>,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
    contentScale: ContentScale = ContentScale.Crop,
    imageHeight: Int = 200,
    placeholderColor: Color = MaterialTheme.colorScheme.surfaceVariant,
    onImageLoaded: ((Int) -> Unit)? = null,
    onImageError: ((Int, Throwable) -> Unit)? = null
) {
    val context = LocalContext.current
    val imageLoader = remember { ImageLoaderFactory.create(context) }
    val performanceMonitor = remember { PerformanceMonitor.getInstance(context) }

    imageUrls.forEachIndexed { index, url ->
        DisposableEffect(url) {
            val startTime = System.nanoTime()
            onDispose {
                val endTime = System.nanoTime()
                performanceMonitor.recordCustomMetric(
                    name = "image_load",
                    value = (endTime - startTime) / 1_000_000.0,
                    metadata = mapOf(
                        "index" to index.toString(),
                        "url" to url
                    )
                )
            }
        }

        CachedAsyncImage(
            imageUrl = url,
            modifier = modifier
                .fillMaxWidth()
                .height(imageHeight.dp)
                .clip(RoundedCornerShape(8.dp)),
            contentDescription = contentDescription,
            contentScale = contentScale,
            placeholderType = ImagePlaceholderType.SHIMMER,
            placeholderColor = placeholderColor,
            onLoadingStarted = {
                performanceMonitor.recordCustomMetric(
                    name = "image_loading_started",
                    value = index.toDouble()
                )
            },
            onLoadingFinished = {
                onImageLoaded?.invoke(index)
            },
            onError = { error ->
                onImageError?.invoke(index, error)
            }
        )
    }
}

@Composable
fun ProgressiveImage(
    imageUrl: String,
    thumbnailUrl: String?,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
    contentScale: ContentScale = ContentScale.Crop,
    placeholderColor: Color = MaterialTheme.colorScheme.surfaceVariant,
    showFullImageOnLoad: Boolean = true
) {
    val context = LocalContext.current
    var isHighResLoaded by remember { mutableStateOf(!showFullImageOnLoad) }

    Box(modifier = modifier) {
        if (thumbnailUrl != null && !isHighResLoaded) {
            CachedAsyncImage(
                imageUrl = thumbnailUrl,
                modifier = Modifier.fillMaxSize(),
                contentDescription = contentDescription,
                contentScale = contentScale,
                placeholderType = ImagePlaceholderType.SHIMMER,
                placeholderColor = placeholderColor,
                onLoadingFinished = {
                    if (showFullImageOnLoad) {
                        isHighResLoaded = true
                    }
                }
            )
        }

        if (isHighResLoaded) {
            CachedAsyncImage(
                imageUrl = imageUrl,
                modifier = Modifier.fillMaxSize(),
                contentDescription = contentDescription,
                contentScale = contentScale,
                placeholderType = if (thumbnailUrl != null) ImagePlaceholderType.NONE else ImagePlaceholderType.SHIMMER,
                placeholderColor = placeholderColor
            )
        }
    }
}

fun clearImageCache() {
    ImageLoaderFactory.get()?.memoryCache?.clear()
    ImageLoaderFactory.get()?.diskCache?.clear()
}
