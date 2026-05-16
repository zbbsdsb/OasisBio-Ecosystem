package com.oasisbio.app.presentation.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.distinctUntilChanged

interface PagedDataLoader<T> {
    suspend fun loadPage(page: Int, pageSize: Int): List<T>
}

@Composable
fun <T : Any> VirtualizedList(
    items: List<T>,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(0.dp),
    key: ((T) -> Any)? = null,
    headerContent: (@Composable () -> Unit)? = null,
    footerContent: (@Composable () -> Unit)? = null,
    itemContent: @Composable (T) -> Unit,
    dividerContent: (@Composable () -> Unit)? = null
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        state = rememberLazyListState(),
        contentPadding = contentPadding
    ) {
        headerContent?.let {
            item(key = "list_header") { it() }
        }

        items(
            count = items.size,
            key = { index -> key?.invoke(items[index]) ?: index }
        ) { index ->
            itemContent(items[index])
            if (dividerContent != null && index < items.size - 1) {
                dividerContent()
            }
        }

        footerContent?.let {
            item(key = "list_footer") { it() }
        }
    }
}

@Composable
fun <T : Any> VirtualizedListWithPagination(
    items: List<T>,
    isLoading: Boolean,
    hasMoreData: Boolean,
    loadMoreThreshold: Int = 5,
    pageSize: Int = 20,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(0.dp),
    itemKey: ((T) -> Any)? = null,
    headerContent: (@Composable () -> Unit)? = null,
    footerContent: (@Composable () -> Unit)? = null,
    loadingIndicator: @Composable () -> Unit = {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    },
    emptyContent: @Composable () -> Unit = {},
    itemContent: @Composable (T) -> Unit,
    dividerContent: (@Composable () -> Unit)? = null,
    onLoadMore: (() -> Unit)? = null
) {
    val listState = rememberLazyListState()

    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val totalItems = listState.layoutInfo.totalItemsCount
            lastVisibleItem >= totalItems - loadMoreThreshold && !isLoading && hasMoreData
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore && onLoadMore != null) {
            onLoadMore()
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        state = listState,
        contentPadding = contentPadding
    ) {
        if (items.isEmpty() && !isLoading) {
            item(key = "empty_content") { emptyContent() }
        } else {
            headerContent?.let {
                item(key = "list_header") { it() }
            }

            items(
                count = items.size,
                key = { index -> itemKey?.invoke(items[index]) ?: index }
            ) { index ->
                itemContent(items[index])
                if (dividerContent != null && index < items.size - 1) {
                    dividerContent()
                }
            }

            if (isLoading) {
                item(key = "loading_indicator") { loadingIndicator() }
            }

            footerContent?.let {
                item(key = "list_footer") { it() }
            }
        }
    }
}

@Composable
fun <T : Any> VirtualizedRow(
    items: List<T>,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(0.dp),
    key: ((T) -> Any)? = null,
    itemContent: @Composable (T) -> Unit
) {
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        state = rememberLazyListState(),
        contentPadding = contentPadding
    ) {
        items(
            count = items.size,
            key = { index -> key?.invoke(items[index]) ?: index }
        ) { index ->
            itemContent(items[index])
        }
    }
}

@Composable
fun <T : Any> VirtualizedRowWithPagination(
    items: List<T>,
    isLoading: Boolean,
    hasMoreData: Boolean,
    loadMoreThreshold: Int = 3,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(0.dp),
    itemKey: ((T) -> Any)? = null,
    loadingIndicator: @Composable () -> Unit = {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    },
    itemContent: @Composable (T) -> Unit,
    onLoadMore: () -> Unit
) {
    val listState = rememberLazyListState()

    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val totalItems = listState.layoutInfo.totalItemsCount
            lastVisibleItem >= totalItems - loadMoreThreshold && !isLoading && hasMoreData
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) {
            onLoadMore()
        }
    }

    LazyRow(
        modifier = modifier.fillMaxWidth(),
        state = listState,
        contentPadding = contentPadding
    ) {
        items(
            count = items.size,
            key = { index -> itemKey?.invoke(items[index]) ?: index }
        ) { index ->
            itemContent(items[index])
        }

        if (isLoading) {
            item(key = "horizontal_loading") { loadingIndicator() }
        }
    }
}

@Composable
fun <T : Any> VirtualizedGrid(
    items: List<T>,
    columns: Int,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(8.dp),
    itemKey: ((T) -> Any)? = null,
    itemHeight: Dp = 150.dp,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.spacedBy(8.dp),
    verticalArrangement: Arrangement.Vertical = Arrangement.spacedBy(8.dp),
    itemContent: @Composable (T) -> Unit
) {
    val rows = items.chunked(columns)
    val listState = rememberLazyListState()

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        state = listState,
        contentPadding = contentPadding,
        verticalArrangement = verticalArrangement
    ) {
        items(
            count = rows.size,
            key = { rowIndex -> "grid_row_$rowIndex" }
        ) { rowIndex ->
            val rowItems = rows[rowIndex]
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = horizontalArrangement
            ) {
                rowItems.forEachIndexed { columnIndex, item ->
                    val itemIndex = rowIndex * columns + columnIndex
                    Box(
                        modifier = Modifier.weight(1f).height(itemHeight),
                        contentAlignment = Alignment.Center
                    ) {
                        itemContent(item)
                    }
                }
                val remainingColumns = columns - rowItems.size
                repeat(remainingColumns) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun Spacer(modifier: Modifier) {
    Box(modifier = modifier)
}
