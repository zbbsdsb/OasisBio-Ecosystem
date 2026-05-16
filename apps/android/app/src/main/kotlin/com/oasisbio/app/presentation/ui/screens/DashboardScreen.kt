package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Globe
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Zap
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.presentation.ui.components.PerformanceMonitorIntegration
import com.oasisbio.app.presentation.viewmodel.IdentityViewModel
import com.oasisbio.app.presentation.viewmodel.WorldBuilderViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    navController: NavHostController,
    identityViewModel: IdentityViewModel = hiltViewModel(),
    worldViewModel: WorldBuilderViewModel = hiltViewModel()
) {
    val identities by identityViewModel.identities.collectAsState()
    val worlds by worldViewModel.worlds.collectAsState()

    LaunchedEffect(Unit) {
        identityViewModel.loadIdentities()
        worldViewModel.loadWorlds()
    }

    val stats = listOf(
        StatItem("身份总数", identities.size.toString(), Icons.Default.Person, MaterialTheme.colorScheme.primary),
        StatItem("世界数量", worlds.size.toString(), Icons.Default.Globe, MaterialTheme.colorScheme.secondary),
        StatItem("能力配置", "34", Icons.Default.Zap, MaterialTheme.colorScheme.tertiary),
        StatItem("活跃项目", "8", Icons.Default.TrendingUp, MaterialTheme.colorScheme.error)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("仪表盘") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        PerformanceMonitorIntegration {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "欢迎回到 OasisBio",
                    style = MaterialTheme.typography.headlineSmall
                )

                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(stats.size) { index ->
                        StatCard(stat = stats[index])
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        onClick = {
                            navController.navigate(NavigationRoutes.CREATE_IDENTITY)
                        }
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "创建新身份",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        onClick = {
                            navController.navigate(NavigationRoutes.WORLD_BUILDER)
                        }
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.secondary,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "创建新世界",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "最近活动",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        repeat(3) { index ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .padding(end = 12.dp),
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = MaterialTheme.colorScheme.primary
                                    ) {}
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = when (index) {
                                            0 -> "更新了身份 \"探险家\""
                                            1 -> "创建了新世界 \"未来之城\""
                                            else -> "添加了新能力"
                                        },
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Text(
                                        text = "${index + 1} 小时前",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
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

@Composable
private fun StatCard(stat: StatItem) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = stat.color.copy(alpha = 0.1f),
                modifier = Modifier.size(56.dp)
            ) {
                Icon(
                    stat.icon,
                    contentDescription = null,
                    tint = stat.color,
                    modifier = Modifier.padding(16.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = stat.label,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = stat.value,
                    style = MaterialTheme.typography.headlineSmall
                )
            }
        }
    }
}

private data class StatItem(
    val label: String,
    val value: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val color: androidx.compose.ui.graphics.Color
)
