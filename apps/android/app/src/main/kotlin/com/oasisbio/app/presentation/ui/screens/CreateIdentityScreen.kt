package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
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
fun CreateIdentityScreen(navController: NavHostController) {
    val viewModel: IdentityViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()
    
    var title by remember { mutableStateOf("") }
    var tagline by remember { mutableStateOf("") }
    var summary by remember { mutableStateOf("") }
    var selectedMode by remember { mutableStateOf(IdentityMode.REAL) }
    var titleError by remember { mutableStateOf<String?>(null) }

    val modes = IdentityMode.entries.toList()
    val snackbarHostState = remember { SnackbarHostState() }

    val isFormValid = remember(title) {
        title.isNotBlank() && title.length >= 2
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
                title = { Text(stringResource(R.string.title_create_identity)) },
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
                        id = "",
                        title = title.trim(),
                        slug = title.trim().lowercase().replace(" ", "-"),
                        tagline = tagline.trim(),
                        summary = summary.trim(),
                        identityMode = selectedMode.displayName,
                        createdAt = "",
                        updatedAt = ""
                    )
                    viewModel.createIdentity(identity)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !state.isLoading
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Creating...")
                } else {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(stringResource(R.string.btn_create))
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