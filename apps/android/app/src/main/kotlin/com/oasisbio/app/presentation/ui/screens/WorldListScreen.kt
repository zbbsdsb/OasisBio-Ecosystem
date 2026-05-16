package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Globe
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.domain.model.World
import com.oasisbio.app.presentation.ui.components.PerformanceMonitorIntegration
import com.oasisbio.app.presentation.ui.components.VirtualizedList
import com.oasisbio.app.presentation.viewmodel.WorldBuilderViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorldListScreen(
    navController: NavHostController,
    viewModel: WorldBuilderViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val worlds by viewModel.worlds.collectAsState()
    var searchTerm by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadWorlds()
    }

    val filteredWorlds = if (searchTerm.isBlank()) {
        worlds
    } else {
        worlds.filter { it.name.contains(searchTerm, ignoreCase = true) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("世界列表") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    navController.navigate(NavigationRoutes.WORLD_BUILDER)
                }
            ) {
                Icon(Icons.Default.Add, contentDescription = "创建世界")
            }
        }
    ) { padding ->
        PerformanceMonitorIntegration {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                when {
                    uiState.isLoading -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                    uiState.error != null -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = uiState.error ?: "加载失败",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.error,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = {
                                viewModel.clearError()
                                viewModel.loadWorlds()
                            }) {
                                Text("重试")
                            }
                        }
                    }
                    else -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            if (worlds.isNotEmpty()) {
                                OutlinedTextField(
                                    value = searchTerm,
                                    onValueChange = { searchTerm = it },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    placeholder = { Text("搜索世界...") },
                                    leadingIcon = {
                                        Icon(Icons.Default.Search, contentDescription = null)
                                    },
                                    singleLine = true
                                )
                            }

                            if (filteredWorlds.isEmpty()) {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Icon(
                                            Icons.Default.Globe,
                                            contentDescription = null,
                                            modifier = Modifier.size(80.dp),
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text(
                                            text = if (searchTerm.isBlank()) "暂无世界" else "未找到匹配的世界",
                                            style = MaterialTheme.typography.headlineSmall,
                                            textAlign = TextAlign.Center
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = if (searchTerm.isBlank()) "创建你的第一个虚构世界吧！" else "尝试使用其他搜索词",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            textAlign = TextAlign.Center
                                        )
                                        if (searchTerm.isBlank()) {
                                            Spacer(modifier = Modifier.height(16.dp))
                                            Button(onClick = {
                                                navController.navigate(NavigationRoutes.WORLD_BUILDER)
                                            }) {
                                                Icon(Icons.Default.Add, contentDescription = null)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text("创建世界")
                                            }
                                        }
                                    }
                                }
                            } else {
                                LazyVerticalGrid(
                                    columns = GridCells.Adaptive(minSize = 180.dp),
                                    contentPadding = PaddingValues(16.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp),
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    items(filteredWorlds, key = { it.id }) { world ->
                                        WorldCard(
                                            world = world,
                                            onClick = {
                                                navController.navigate("${NavigationRoutes.WORLD_DETAIL.replace("{id}", world.id)}")
                                            },
                                            onEdit = {
                                                navController.navigate(NavigationRoutes.WORLD_BUILDER)
                                            },
                                            onDelete = {
                                                viewModel.deleteWorld(world.id)
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WorldCard(
    world: World,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Globe,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Row {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, contentDescription = "编辑")
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, contentDescription = "删除")
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = world.name,
                style = MaterialTheme.typography.titleMedium
            )
            if (world.description.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = world.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3
                )
            }
        }
    }
}
