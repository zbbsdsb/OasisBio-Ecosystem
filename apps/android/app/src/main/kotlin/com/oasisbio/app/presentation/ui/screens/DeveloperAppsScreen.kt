package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Link
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.presentation.navigation.NavigationRoutes
import com.oasisbio.app.presentation.ui.components.PerformanceMonitorIntegration
import com.oasisbio.app.presentation.viewmodel.DeveloperAppsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeveloperAppsScreen(
    navController: NavHostController,
    viewModel: DeveloperAppsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var editingApp by remember { mutableStateOf<OAuthApp?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadApps()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("开发者应用") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            if (uiState.apps.isNotEmpty()) {
                FloatingActionButton(
                    onClick = { showCreateDialog = true }
                ) {
                    Icon(Icons.Default.Add, contentDescription = "创建应用")
                }
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
                        LoadingContent()
                    }
                    uiState.error != null -> {
                        ErrorContent(
                            message = uiState.error ?: stringResource(R.string.error_generic),
                            onRetry = { viewModel.loadApps() }
                        )
                    }
                    uiState.apps.isEmpty() -> {
                        EmptyContent(
                            onCreateClick = { showCreateDialog = true }
                        )
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(
                                count = uiState.apps.size,
                                key = { index -> uiState.apps[index].id }
                            ) { index ->
                                val app = uiState.apps[index]
                                OAuthAppCard(
                                    app = app,
                                    onEdit = { editingApp = app },
                                    onDelete = { viewModel.deleteApp(app.id) }
                                )
                            }
                            item {
                                Spacer(modifier = Modifier.height(80.dp))
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateAppDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { registration ->
                viewModel.createApp(registration)
                showCreateDialog = false
            }
        )
    }

    editingApp?.let { app ->
        EditAppDialog(
            app = app,
            onDismiss = { editingApp = null },
            onSave = { updatedApp ->
                viewModel.updateApp(updatedApp)
                editingApp = null
            }
        )
    }
}

@Composable
private fun LoadingContent() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(48.dp),
            strokeWidth = 4.dp
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.loading),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ErrorContent(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = stringResource(R.string.error_generic),
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onRetry) {
            Text(stringResource(R.string.btn_retry))
        }
    }
}

@Composable
private fun EmptyContent(onCreateClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Link,
            contentDescription = null,
            modifier = Modifier.size(96.dp),
            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "暂无 OAuth 应用",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "创建您的第一个 OAuth 应用程序以启用「使用 Oasis 登录」功能",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(32.dp))
        Button(
            onClick = onCreateClick,
            modifier = Modifier.fillMaxWidth(0.6f)
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("创建应用")
        }
    }
}

@Composable
fun OAuthAppCard(
    app: OAuthApp,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val clipboardManager = LocalClipboardManager.current
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var copiedId by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = app.name,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        SuggestionChip(
                            onClick = {},
                            label = { Text("活跃") }
                        )
                    }
                    if (app.description.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = app.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Row {
                    IconButton(onClick = onEdit) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "编辑",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    IconButton(onClick = { showDeleteConfirm = true }) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "删除",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Client ID",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = app.clientId,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        TextButton(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(app.clientId))
                                copiedId = true
                            }
                        ) {
                            Text(if (copiedId) "已复制" else "复制")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Column {
                Text(
                    text = "Redirect URIs (${app.redirectUris.size})",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(4.dp))
                app.redirectUris.take(3).forEach { uri ->
                    Text(
                        text = uri,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                if (app.redirectUris.size > 3) {
                    Text(
                        text = "+${app.redirectUris.size - 3} more",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "创建时间: ${app.createdAt}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("删除应用") },
            text = { Text("确定要删除「${app.name}」吗？此操作无法撤销。") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete()
                        showDeleteConfirm = false
                    },
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("删除")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("取消")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateAppDialog(
    onDismiss: () -> Unit,
    onCreate: (OAuthAppRegistration) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var homepageUrl by remember { mutableStateOf("") }
    var redirectUris by remember { mutableStateOf("") }
    var logoUrl by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("创建新应用") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("应用名称 *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("描述 *") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = homepageUrl,
                    onValueChange = { homepageUrl = it },
                    label = { Text("主页 URL *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = redirectUris,
                    onValueChange = { redirectUris = it },
                    label = { Text("Redirect URIs (每行一个) *") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    placeholder = { Text("https://myapp.com/callback") },
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = logoUrl,
                    onValueChange = { logoUrl = it },
                    label = { Text("Logo URL (可选)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    imeAction = ImeAction.Done
                )
                errorMessage?.let {
                    Text(
                        text = it,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val uris = redirectUris.split("\n").map { it.trim() }.filter { it.isNotEmpty() }
                    if (name.isBlank() || description.isBlank() || homepageUrl.isBlank() || uris.isEmpty()) {
                        errorMessage = "请填写所有必填字段"
                        return@Button
                    }
                    onCreate(
                        OAuthAppRegistration(
                            name = name,
                            description = description,
                            homepageUrl = homepageUrl,
                            redirectUris = uris,
                            logoUrl = logoUrl.takeIf { it.isNotBlank() }
                        )
                    )
                },
                enabled = !isSubmitting
            ) {
                Text("创建")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditAppDialog(
    app: OAuthApp,
    onDismiss: () -> Unit,
    onSave: (OAuthApp) -> Unit
) {
    var name by remember { mutableStateOf(app.name) }
    var description by remember { mutableStateOf(app.description) }
    var homepageUrl by remember { mutableStateOf(app.homepageUrl) }
    var redirectUris by remember { mutableStateOf(app.redirectUris.joinToString("\n")) }
    var logoUrl by remember { mutableStateOf(app.logoUrl ?: "") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("编辑应用") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("应用名称 *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("描述 *") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = homepageUrl,
                    onValueChange = { homepageUrl = it },
                    label = { Text("主页 URL *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = redirectUris,
                    onValueChange = { redirectUris = it },
                    label = { Text("Redirect URIs (每行一个) *") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    placeholder = { Text("https://myapp.com/callback") },
                    imeAction = ImeAction.Next
                )
                OutlinedTextField(
                    value = logoUrl,
                    onValueChange = { logoUrl = it },
                    label = { Text("Logo URL (可选)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    imeAction = ImeAction.Done
                )
                errorMessage?.let {
                    Text(
                        text = it,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val uris = redirectUris.split("\n").map { it.trim() }.filter { it.isNotEmpty() }
                    if (name.isBlank() || description.isBlank() || homepageUrl.isBlank() || uris.isEmpty()) {
                        errorMessage = "请填写所有必填字段"
                        return@Button
                    }
                    onSave(
                        app.copy(
                            name = name,
                            description = description,
                            homepageUrl = homepageUrl,
                            redirectUris = uris,
                            logoUrl = logoUrl.takeIf { it.isNotBlank() },
                            updatedAt = System.currentTimeMillis().toString()
                        )
                    )
                },
                enabled = !isSubmitting
            ) {
                Text("保存")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

data class OAuthApp(
    val id: String,
    val clientId: String,
    val clientSecret: String,
    val name: String,
    val description: String,
    val homepageUrl: String,
    val redirectUris: List<String>,
    val logoUrl: String?,
    val ownerUserId: String,
    val createdAt: String,
    val updatedAt: String
)

data class OAuthAppRegistration(
    val name: String,
    val description: String,
    val homepageUrl: String,
    val redirectUris: List<String>,
    val logoUrl: String?
)
