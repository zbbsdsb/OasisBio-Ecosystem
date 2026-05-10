package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.presentation.navigation.NavigationRoutes
import com.oasisbio.app.presentation.viewmodel.AuthViewModel

@Composable
fun LoginScreen(navController: NavHostController) {
    val viewModel: AuthViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()
    val email = remember { mutableStateOf("") }
    val otp = remember { mutableStateOf("") }

    LaunchedEffect(state.isAuthenticated) {
        if (state.isAuthenticated) {
            navController.navigate(NavigationRoutes.IDENTITIES) {
                popUpTo(NavigationRoutes.WELCOME) { inclusive = true }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.title_login)) },
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
                .padding(horizontal = 32.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (!state.otpSent) {
                OutlinedTextField(
                    value = email.value,
                    onValueChange = { email.value = it },
                    label = { Text(stringResource(R.string.hint_email)) },
                    keyboardType = KeyboardType.Email,
                    modifier = Modifier.fillMaxWidth(),
                    isError = state.error != null,
                    supportingText = {
                        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    }
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = { 
                        viewModel.clearError()
                        viewModel.sendOtp(email.value) 
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !state.isLoading
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp))
                    } else {
                        Text(stringResource(R.string.btn_send_otp))
                    }
                }
            } else {
                OutlinedTextField(
                    value = otp.value,
                    onValueChange = { otp.value = it },
                    label = { Text(stringResource(R.string.hint_otp)) },
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.fillMaxWidth(),
                    isError = state.error != null,
                    supportingText = {
                        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    }
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = { 
                        viewModel.clearError()
                        viewModel.verifyOtp(otp.value) 
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !state.isLoading
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp))
                    } else {
                        Text(stringResource(R.string.btn_verify))
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                TextButton(onClick = { viewModel.resetOtpState() }) {
                    Text(stringResource(R.string.btn_back))
                }
            }
        }
    }
}