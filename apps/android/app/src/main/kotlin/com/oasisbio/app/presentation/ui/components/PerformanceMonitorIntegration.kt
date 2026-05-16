package com.oasisbio.app.presentation.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oasisbio.app.util.PerformanceMonitor
import com.oasisbio.app.util.PerformanceMetric
import com.oasisbio.app.util.PerformanceThresholds
import com.oasisbio.app.util.SlowOperationAlert
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest

@Composable
fun PerformanceMonitorPanel(
    modifier: Modifier = Modifier,
    showDetails: Boolean = false,
    thresholds: PerformanceThresholds = PerformanceThresholds()
) {
    val context = LocalContext.current
    val monitor = remember { PerformanceMonitor.getInstance(context, thresholds) }

    var currentFps by remember { mutableFloatStateOf(60f) }
    var currentMemoryUsage by remember { mutableFloatStateOf(0f) }
    var slowOperationsCount by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        monitor.startMonitoring()
    }

    DisposableEffect(Unit) {
        onDispose {
            monitor.stopMonitoring()
        }
    }

    LaunchedEffect(Unit) {
        monitor.currentFps.collectLatest { fps ->
            currentFps = fps
        }
    }

    LaunchedEffect(Unit) {
        monitor.currentMemoryUsage.collectLatest { memory ->
            currentMemoryUsage = memory.usagePercent
        }
    }

    LaunchedEffect(Unit) {
        monitor.slowOperationAlertsFlow.collectLatest {
            slowOperationsCount++
        }
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.9f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Performance",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                MetricIndicator(
                    icon = Icons.Default.Speed,
                    label = "FPS",
                    value = String.format("%.1f", currentFps),
                    isGood = currentFps >= thresholds.frameRateFps,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                MetricIndicator(
                    icon = Icons.Default.Memory,
                    label = "Memory",
                    value = String.format("%.1f%%", currentMemoryUsage),
                    isGood = currentMemoryUsage < thresholds.memoryUsagePercent,
                    modifier = Modifier.weight(1f)
                )

                Spacer(modifier = Modifier.width(8.dp))

                MetricIndicator(
                    icon = Icons.Default.Storage,
                    label = "Alerts",
                    value = slowOperationsCount.toString(),
                    isGood = slowOperationsCount == 0,
                    modifier = Modifier.weight(1f)
                )
            }

            if (showDetails) {
                Spacer(modifier = Modifier.height(16.dp))

                FpsChart(
                    currentFps = currentFps,
                    targetFps = thresholds.frameRateFps,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                )
            }
        }
    }
}

@Composable
fun MetricIndicator(
    icon: ImageVector,
    label: String,
    value: String,
    isGood: Boolean,
    modifier: Modifier = Modifier
) {
    val indicatorColor = if (isGood) Color(0xFF4CAF50) else Color(0xFFFF5722)

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(indicatorColor.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = indicatorColor,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = indicatorColor
        )

        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun FpsChart(
    currentFps: Float,
    targetFps: Float,
    modifier: Modifier = Modifier,
    chartColor: Color = Color(0xFF4CAF50),
    targetColor: Color = Color(0xFFFF5722)
) {
    var fpsHistory by remember { mutableStateOf(listOf<Float>()) }

    LaunchedEffect(currentFps) {
        fpsHistory = (fpsHistory + currentFps).takeLast(30)
    }

    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val pointSpacing = width / 29

        if (fpsHistory.size > 1) {
            val path = Path()
            fpsHistory.forEachIndexed { index, fps ->
                val x = index * pointSpacing
                val y = height - (fps / 60f * height)

                if (index == 0) {
                    path.moveTo(x, y)
                } else {
                    path.lineTo(x, y)
                }
            }

            drawPath(
                path = path,
                color = chartColor,
                style = Stroke(width = 2.dp.toPx())
            )
        }

        val targetY = height - (targetFps / 60f * height)
        drawLine(
            color = targetColor,
            start = Offset(0f, targetY),
            end = Offset(width, targetY),
            strokeWidth = 1.dp.toPx()
        )
    }
}

@Composable
fun RecompositionCounter(
    modifier: Modifier = Modifier,
    label: String = "Recompositions"
) {
    var recompositionCount by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        delay(1000)
        recompositionCount = 0
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(MaterialTheme.colorScheme.errorContainer)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = "$label: $recompositionCount",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onErrorContainer
        )
    }
}

@Composable
fun CompositionTracingTag(
    tag: String,
    content: @Composable () -> Unit
) {
    Box(
        modifier = Modifier
            .drawWithContent {
                drawContent()
            }
    ) {
        content()
    }
}

@Composable
fun rememberTrackedState(
    key: String,
    initialValue: String
): String {
    val context = LocalContext.current
    val monitor = remember { PerformanceMonitor.getInstance(context) }
    var state by remember { mutableStateOf(initialValue) }

    LaunchedEffect(state) {
        monitor.recordCustomMetric(
            name = "state_change",
            value = 1.0,
            metadata = mapOf(
                "key" to key,
                "value" to state
            )
        )
    }

    return state
}

@Composable
fun rememberTrackedCallback(
    callbackName: String,
    block: () -> Unit
): () -> Unit {
    val context = LocalContext.current
    val monitor = remember { PerformanceMonitor.getInstance(context) }

    return remember(block) {
        var callCount = 0
        {
            callCount++
            monitor.recordCustomMetric(
                name = "callback_invocation",
                value = callCount.toDouble(),
                metadata = mapOf("callback" to callbackName)
            )
            block()
        }
    }
}

@Composable
fun performanceTrackedLazyList(
    listState: androidx.compose.foundation.lazy.LazyListState,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val monitor = remember { PerformanceMonitor.getInstance(context) }

    LaunchedEffect(listState.firstVisibleItemIndex) {
        monitor.recordCustomMetric(
            name = "scroll_position",
            value = listState.firstVisibleItemIndex.toDouble(),
            metadata = mapOf(
                "offset" to listState.firstVisibleItemScrollOffset.toString()
            )
        )
    }

    Box {
        content()
    }
}

@Composable
fun rememberSkippableEffect(
    key: Any?,
    effect: @Composable () -> Unit
) {
    if (key != null) {
        effect()
    }
}

@Composable
fun performanceOptimizedCard(
    onClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val monitor = remember { PerformanceMonitor.getInstance(context) }

    Card(
        modifier = modifier,
        onClick = {
            val startTime = System.nanoTime()
            onClick?.invoke()
            val duration = System.nanoTime() - startTime
            monitor.recordCustomMetric(
                name = "card_click_duration",
                value = duration / 1_000_000.0
            )
        },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        content()
    }
}

@Composable
fun FrameRateMonitor(
    modifier: Modifier = Modifier,
    targetFps: Float = 60f
) {
    val context = LocalContext.current
    val monitor = remember { PerformanceMonitor.getInstance(context) }
    var currentFps by remember { mutableFloatStateOf(targetFps) }
    var droppedFrames by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        monitor.currentFps.collect { fps ->
            currentFps = fps
            if (fps < targetFps) {
                droppedFrames++
            }
        }
    }

    DisposableEffect(Unit) {
        monitor.startMonitoring()
        onDispose {
            monitor.recordCustomMetric(
                name = "total_dropped_frames",
                value = droppedFrames.toDouble()
            )
        }
    }

    Column(
        modifier = modifier.padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "FPS: ${String.format("%.1f", currentFps)}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = if (currentFps >= targetFps) Color(0xFF4CAF50) else Color(0xFFFF5722)
        )

        Text(
            text = "Dropped: $droppedFrames",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun MemoryUsageMonitor(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val monitor = remember { PerformanceMonitor.getInstance(context) }
    var memoryUsage by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(Unit) {
        monitor.currentMemoryUsage.collect { memory ->
            memoryUsage = memory.usagePercent
        }
    }

    DisposableEffect(Unit) {
        monitor.startMonitoring()
        onDispose { }
    }

    Column(
        modifier = modifier.padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Memory: ${String.format("%.1f%%", memoryUsage)}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = when {
                memoryUsage < 60f -> Color(0xFF4CAF50)
                memoryUsage < 80f -> Color(0xFFFF9800)
                else -> Color(0xFFFF5722)
            }
        )
    }
}
