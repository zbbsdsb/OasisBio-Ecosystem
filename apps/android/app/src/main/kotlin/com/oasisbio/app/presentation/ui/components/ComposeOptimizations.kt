package com.oasisbio.app.presentation.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.ProxyDisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach

@Composable
fun <T> rememberComputedValue(
    key1: Any?,
    calculation: () -> T
): T {
    return remember(key1) { derivedStateOf { calculation() } }.value
}

@Composable
fun <T1, T2> rememberComputedValue(
    key1: Any?,
    key2: Any?,
    calculation: () -> T2
): T2 {
    return remember(key1, key2) { derivedStateOf { calculation() } }.value
}

@Composable
fun <T> rememberCachedCalculation(
    vararg keys: Any?,
    calculation: () -> T
): T {
    return remember(*keys) { derivedStateOf(calculation) }.value
}

@Composable
fun <T> rememberOptimizedState(
    initialValue: T,
    keys: Array<Any?> = arrayOf(Unit),
    updateBlock: () -> T
): T {
    var lastValue by remember(*keys) { mutableStateOf(initialValue) }
    lastValue = updateBlock()
    return lastValue
}

@Composable
fun <T> derivedStateOfWithTracking(
    trackId: String,
    calculation: () -> T
): T {
    val context = androidx.compose.ui.platform.LocalContext.current
    val performanceMonitor = remember {
        try {
            com.oasisbio.app.util.PerformanceMonitor.getInstance(context)
        } catch (e: Exception) {
            null
        }
    }

    return remember(trackId) {
        derivedStateOf {
            val startTime = System.nanoTime()
            val result = calculation()
            val duration = System.nanoTime() - startTime
            performanceMonitor?.recordCustomMetric(
                name = "derived_state_calculation",
                value = duration / 1_000_000.0,
                metadata = mapOf("track_id" to trackId)
            )
            result
        }
    }.value
}

@Composable
fun rememberDerivedScrollOffset(
    listState: LazyListState,
    offsetProvider: (firstVisibleItemIndex: Int, firstVisibleItemScrollOffset: Int) -> Int
): Int {
    return rememberDerivedStateOf(
        trackId = "scroll_offset",
        calculation = {
            offsetProvider(
                listState.firstVisibleItemIndex,
                listState.firstVisibleItemScrollOffset
            )
        }
    )
}

@Composable
fun <T> collectStateAsStateFlow(
    flow: Flow<T>,
    initialValue: T
): T {
    val state = remember { mutableStateOf(initialValue) }
    LaunchedEffect(flow) {
        flow.collect { value ->
            state.value = value
        }
    }
    return state.value
}

@OptIn(FlowPreview::class)
@Composable
fun <T> collectSnapshotFlow(
    flow: Flow<T>,
    onEach: (T) -> Unit,
    debounceMs: Long = 300L
) {
    LaunchedEffect(flow) {
        flow
            .debounce(debounceMs)
            .distinctUntilChanged()
            .onEach { value ->
                onEach(value)
            }
            .launchIn(this)
        }
}

@Composable
fun <T> observeStateFlow(
    stateFlow: StateFlow<T>,
    key: Any? = Unit
): T {
    val value by rememberUpdatedState(stateFlow.value)
    return value
}

@Composable
fun <T> observeStateFlowWithDebounce(
    stateFlow: StateFlow<T>,
    debounceMs: Long = 300L
): T {
    var debouncedValue by remember { mutableStateOf(stateFlow.value) }
    LaunchedEffect(stateFlow) {
        snapshotFlow { stateFlow.value }
            .debounce(debounceMs)
            .collect { debouncedValue = it }
    }
    return debouncedValue
}

@Composable
fun performanceOptimizedLazyList(
    modifier: Modifier = Modifier,
    listState: LazyListState = rememberLazyListState(),
    onScrollPositionChanged: ((Int, Int) -> Unit)? = null,
    onScrollPerformanceLog: ((Long) -> Unit)? = null,
    content: @Composable (LazyListState) -> Unit
) {
    var lastScrollTime by remember { mutableStateOf(System.nanoTime()) }
    val debouncedOnScroll = remember { mutableStateOf<(Int, Int) -> Unit> {} }

    LaunchedEffect(onScrollPositionChanged) {
        snapshotFlow {
            listState.firstVisibleItemIndex to listState.firstVisibleItemScrollOffset
        }
            .debounce(100L)
            .distinctUntilChanged()
            .collect { (index, offset) ->
                onScrollPositionChanged?.invoke(index, offset)
            }
    }

    LaunchedEffect(Unit) {
        snapshotFlow { listState.isScrollInProgress }
            .filter { !it }
            .collect {
                val currentTime = System.nanoTime()
                val scrollDuration = currentTime - lastScrollTime
                lastScrollTime = currentTime
                onScrollPerformanceLog?.invoke(scrollDuration)
            }
    }

    Box(modifier = modifier) {
        content(listState)
    }
}

@Composable
fun rememberOptimizedFilter(
    items: List<String>,
    searchQuery: String,
    vararg extraKeys: Any?
): List<String> {
    return rememberDerivedStateOf(
        trackId = "filter_optimized_${searchQuery.hashCode()}",
        calculation = {
            if (searchQuery.isBlank()) {
                items
            } else {
                items.filter { item ->
                    item.contains(searchQuery, ignoreCase = true)
                }
            }
        }
    )
}

@Composable
fun <T : Comparable<T>> rememberOptimizedSort(
    items: List<T>,
    ascending: Boolean,
    vararg extraKeys: Any?
): List<T> {
    return rememberDerivedStateOf(
        trackId = "sort_optimized_${ascending.hashCode()}",
        calculation = {
            if (ascending) {
                items.sorted()
            } else {
                items.sortedDescending()
            }
        }
    )
}

@Composable
fun rememberOptimizedGroupBy(
    items: List<String>,
    groupKeyExtractor: (String) -> String,
    vararg extraKeys: Any?
): Map<String, List<String>> {
    return rememberDerivedStateOf(
        trackId = "groupby_${items.hashCode()}",
        calculation = {
            items.groupBy(groupKeyExtractor)
        }
    )
}

@Composable
fun OptimizedVisibility(
    visible: Boolean,
    modifier: Modifier = Modifier,
    enter: EnterTransition = fadeIn(),
    exit: ExitTransition = fadeOut(),
    content: @Composable () -> Unit
) {
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = enter,
        exit = exit
    ) {
        content()
    }
}

@Composable
fun OptimizedConditionalContent(
    condition: Boolean,
    trueContent: @Composable () -> Unit,
    falseContent: @Composable (() -> Unit)? = null
) {
    if (condition) {
        trueContent()
    } else {
        falseContent?.invoke()
    }
}

@Composable
fun <T> OptimizedListItem(
    item: T,
    isSelected: Boolean,
    key: Any?,
    content: @Composable (T, Boolean) -> Unit
) {
    val derivedKey = remember(item, key) {
        derivedStateOf { key ?: item.hashCode() }
    }

    Box(key = derivedKey.value) {
        content(item, isSelected)
    }
}

@Composable
fun rememberConditionalRecomposition(
    condition: Boolean,
    content: @Composable () -> Unit
) {
    if (condition) {
        content()
    }
}

@Composable
fun OptimizedRow(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Row(
        modifier = modifier
            .drawBehind {
                // Intentionally empty - prevents unnecessary repaints
            }
    ) {
        content()
    }
}

@Composable
fun OptimizedColumn(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Column(modifier = modifier) {
        content()
    }
}

@Composable
fun StableSpacer(
    modifier: Modifier = Modifier
) {
    Spacer(modifier = modifier)
}

@Composable
fun LazyRecompositionGuard(
    key: Any?,
    content: @Composable () -> Unit
) {
    val derivedKey = remember(key) {
        derivedStateOf { key ?: Any() }
    }

    Box(key = derivedKey.value) {
        content()
    }
}

@Composable
fun ConditionalPadding(
    condition: Boolean,
    padding: Int,
    content: @Composable () -> Unit
) {
    if (condition) {
        Box(modifier = Modifier.padding(padding.dp)) {
            content()
        }
    } else {
        content()
    }
}

@Composable
fun OptimizedLoadingIndicator(
    isLoading: Boolean,
    modifier: Modifier = Modifier,
    progressColor: Color = Color.Gray,
    backgroundColor: Color = Color.LightGray
) {
    AnimatedVisibility(
        visible = isLoading,
        modifier = modifier
    ) {
        LinearProgressIndicator(
            modifier = Modifier.fillMaxWidth(),
            color = progressColor,
            trackColor = backgroundColor
        )
    }
}

@Composable
fun rememberStableCallback(
    callback: () -> Unit
): () -> Unit {
    val updatedCallback by rememberUpdatedState(callback)
    return remember { updatedCallback }
}

@Composable
fun <T> rememberStableList(vararg keys: Any?, list: List<T>): List<T> {
    return remember(*keys) { list }
}
