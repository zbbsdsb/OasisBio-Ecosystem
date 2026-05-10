package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
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
    
    val title = remember { mutableStateOf("") }
    val tagline = remember { mutableStateOf("") }
    val summary = remember { mutableStateOf("") }
    val selectedMode = remember { mutableStateOf(IdentityMode.REAL) }

    val modes = IdentityMode.values().toList()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.title_create_identity)) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.ArrowBack,
                            contentDescription = stringResource(R.string.btn_back)
                        )
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            OutlinedTextField(
                value = title.value,
                onValueChange = { title.value = it },
                label = { Text(stringResource(R.string.hint_title)) },
                modifier = Modifier.fillMaxWidth(),
                isError = state.error != null
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedTextField(
                value = tagline.value,
                onValueChange = { tagline.value = it },
                label = { Text(stringResource(R.string.hint_tagline)) },
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedTextField(
                value = summary.value,
                onValueChange = { summary.value = it },
                label = { Text(stringResource(R.string.hint_summary)) },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 5
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = stringResource(R.string.label_identity_mode),
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally
            ) {
                modes.forEach { mode ->
                    FilterChip(
                        selected = selectedMode.value == mode,
                        onClick = { selectedMode.value = mode },
                        label = { Text(mode.displayName) }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = {
                    val identity = OasisBio(
                        id = "",
                        title = title.value,
                        slug = title.value.lowercase().replace(" ", "-"),
                        tagline = tagline.value,
                        summary = summary.value,
                        identityMode = selectedMode.value.displayName,
                        createdAt = "",
                        updatedAt = ""
                    )
                    viewModel.createIdentity(identity)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = title.value.isNotBlank() && !state.isLoading
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp))
                } else {
                    Text(stringResource(R.string.btn_create))
                }
            }
            
            if (state.error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = state.error ?: stringResource(R.string.error_generic),
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.align(androidx.compose.ui.Alignment.CenterHorizontally)
                )
            }
        }
    }

    LaunchedEffect(state.operationSuccess) {
        if (state.operationSuccess) {
            navController.popBackStack()
        }
    }
}