package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Globe
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
import com.oasisbio.app.presentation.viewmodel.WorldBuilderViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorldDetailScreen(
    navController: NavHostController,
    worldId: String,
    viewModel: WorldBuilderViewModel = hiltViewModel()
) {
    val worlds by viewModel.worlds.collectAsState()
    val world = worlds.find { it.id == worldId }

    LaunchedEffect(Unit) {
        if (worlds.isEmpty()) {
            viewModel.loadWorlds()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(world?.name ?: "世界详情") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    if (world != null) {
                        IconButton(onClick = {
                            navController.navigate(NavigationRoutes.WORLD_BUILDER)
                        }) {
                            Icon(Icons.Default.Edit, contentDescription = "编辑")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        PerformanceMonitorIntegration {
            if (world == null) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.Globe,
                            contentDescription = null,
                            modifier = Modifier.size(80.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "世界不存在",
                            style = MaterialTheme.typography.headlineSmall,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = world.name,
                                style = MaterialTheme.typography.headlineMedium
                            )
                            if (world.description.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = world.description,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    if (world.setting.genre.isNotBlank() || world.setting.tone.isNotBlank()) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "基本信息",
                                    style = MaterialTheme.typography.titleLarge
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                if (world.setting.genre.isNotBlank()) {
                                    Text(
                                        text = "类型: ${world.setting.genre}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                                if (world.setting.tone.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "基调: ${world.setting.tone}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                                if (world.setting.themes.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "主题:",
                                        style = MaterialTheme.typography.titleMedium
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        world.setting.themes.forEach { theme ->
                                            SuggestionChip(
                                                onClick = {},
                                                label = { Text(theme) }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (world.setting.characters.isNotEmpty()) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "角色 (${world.setting.characters.size})",
                                    style = MaterialTheme.typography.titleLarge
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                world.setting.characters.forEach { character ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text(
                                                text = character.name,
                                                style = MaterialTheme.typography.titleMedium
                                            )
                                            if (character.description.isNotBlank()) {
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = character.description,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }
                        }
                    }

                    if (world.setting.locations.isNotEmpty()) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "地点 (${world.setting.locations.size})",
                                    style = MaterialTheme.typography.titleLarge
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                world.setting.locations.forEach { location ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text(
                                                text = location.name,
                                                style = MaterialTheme.typography.titleMedium
                                            )
                                            if (location.description.isNotBlank()) {
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = location.description,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }
                        }
                    }

                    if (world.setting.lore.isNotEmpty()) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "世界观设定 (${world.setting.lore.size})",
                                    style = MaterialTheme.typography.titleLarge
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                world.setting.lore.forEach { lore ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text(
                                                text = lore.title,
                                                style = MaterialTheme.typography.titleMedium
                                            )
                                            if (lore.content.isNotBlank()) {
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = lore.content,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
