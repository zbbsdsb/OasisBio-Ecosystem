package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.domain.model.IdentityMode
import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.presentation.navigation.NavigationRoutes
import com.oasisbio.app.presentation.viewmodel.IdentityViewModel

@Composable
fun EditIdentityScreen(navController: NavHostController, identityId: String) {
    val viewModel: IdentityViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()
    
    var title by remember { mutableStateOf("") }
    var tagline by remember { mutableStateOf("") }
    var summary by remember { mutableStateOf("") }
    var selectedMode by remember { mutableStateOf(IdentityMode.REAL) }
    var titleError by remember { mutableStateOf<String?>(null) }
    var isInitialized by remember { mutableStateOf(false) }

    val modes = IdentityMode.entries.toList()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(identityId) {
        viewModel.loadIdentity(identityId)
    }

    LaunchedEffect(state.selectedIdentity) {
        if (!isInitialized) {
            state.selectedIdentity?.let { identity ->
                title = identity.title
                tagline = identity.tagline
                summary = identity.summary
                selectedMode = IdentityMode.fromString(identity.identityMode)
                isInitialized = true
            }
        }
    }

    LaunchedEffect(state.operationSuccess) {
        if (state.operationSuccess) {
            viewModel.clearSuccess()
            navController.popBackStack()
        }
    }

    LaunchedEffect(state.error) {
        state.error?.let { error ->
            snackbarHostState.showSnackbar(
                message = error,
                duration = SnackbarDuration.Short
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.title_edit_identity)) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.btn_back)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            state.isLoading && !isInitialized -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
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
            }
            state.error != null && state.selectedIdentity == null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
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
                        text = state.error ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(onClick = { viewModel.loadIdentity(identityId) }) {
                        Text(stringResource(R.string.btn_retry))
                    }
                }
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Basic Information",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            OutlinedTextField(
                                value = title,
                                onValueChange = {
                                    title = it
                                    titleError = null
                                },
                                label = { Text(stringResource(R.string.hint_title)) },
                                modifier = Modifier.fillMaxWidth(),
                                isError = titleError != null,
                                supportingText = {
                                    titleError?.let {
                                        Text(
                                            text = it,
                                            color = MaterialTheme.colorScheme.error
                                        )
                                    }
                                },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(
                                    capitalization = KeyboardCapitalization.Words,
                                    imeAction = ImeAction.Next
                                )
                            )
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            OutlinedTextField(
                                value = tagline,
                                onValueChange = { tagline = it },
                                label = { Text(stringResource(R.string.hint_tagline)) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(
                                    capitalization = KeyboardCapitalization.Sentences,
                                    imeAction = ImeAction.Next
                                )
                            )
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            OutlinedTextField(
                                value = summary,
                                onValueChange = { summary = it },
                                label = { Text(stringResource(R.string.hint_summary)) },
                                modifier = Modifier.fillMaxWidth(),
                                minLines = 3,
                                maxLines = 5,
                                keyboardOptions = KeyboardOptions(
                                    capitalization = KeyboardCapitalization.Sentences,
                                    imeAction = ImeAction.Done
                                )
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = stringResource(R.string.label_identity_mode),
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            modes.chunked(2).forEach { rowModes ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    rowModes.forEach { mode ->
                                        FilterChip(
                                            selected = selectedMode == mode,
                                            onClick = { selectedMode = mode },
                                            label = { Text(mode.displayName) },
                                            leadingIcon = if (selectedMode == mode) {
                                                {
                                                    Icon(
                                                        imageVector = Icons.Default.Check,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(18.dp)
                                                    )
                                                }
                                            } else null,
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                    if (rowModes.size == 1) {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }
                    }
                    
                    if (state.selectedIdentity != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(
                                        text = "Created",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = state.selectedIdentity?.createdAt ?: "",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = "Last Updated",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = state.selectedIdentity?.updatedAt ?: "",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Button(
                        onClick = {
                            if (title.isBlank()) {
                                titleError = "Title is required"
                                return@Button
                            }
                            if (title.length < 2) {
                                titleError = "Title must be at least 2 characters"
                                return@Button
                            }
                            
                            val identity = OasisBio(
                                id = identityId,
                                title = title.trim(),
                                slug = title.trim().lowercase().replace(" ", "-"),
                                tagline = tagline.trim(),
                                summary = summary.trim(),
                                identityMode = selectedMode.displayName,
                                createdAt = state.selectedIdentity?.createdAt ?: "",
                                updatedAt = ""
                            )
                            viewModel.updateIdentity(identityId, identity)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = !state.isLoading && isInitialized
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = MaterialTheme.colorScheme.onPrimary,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Saving...")
                        } else {
                            Icon(Icons.Default.Save, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(stringResource(R.string.btn_save))
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedButton(
                        onClick = { navController.popBackStack() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = !state.isLoading
                    ) {
                        Text(stringResource(R.string.btn_cancel))
                    }
                }
            }
        }
    }
}