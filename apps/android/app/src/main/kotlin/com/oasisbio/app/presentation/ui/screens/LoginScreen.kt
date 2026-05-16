package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.presentation.navigation.NavigationRoutes
import com.oasisbio.app.presentation.viewmodel.AuthViewModel
import com.oasisbio.app.util.EmailValidator

@Composable
fun LoginScreen(navController: NavHostController) {
    val viewModel: AuthViewModel = hiltViewModel()
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

    var email by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }

    val isEmailValid = remember(email) {
        email.isEmpty() || EmailValidator.isValidEmail(email)
    }

    LaunchedEffect(uiState.isOtpSent) {
        if (uiState.isOtpSent) {
            navController.navigate("${NavigationRoutes.OTP}?email=$email")
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.title_login)) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
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
            Text(
                text = stringResource(R.string.login_title),
                style = MaterialTheme.typography.headlineMedium,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = stringResource(R.string.login_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { 
                    email = it
                    emailError = null
                    viewModel.clearError()
                },
                label = { Text(stringResource(R.string.hint_email)) },
                placeholder = { Text(stringResource(R.string.hint_email_placeholder)) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Email,
                        contentDescription = null
                    )
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                ),
                keyboardActions = KeyboardActions(
                    onNext = { focusManager.moveFocus(androidx.compose.ui.focus.FocusDirection.Down) }
                ),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                isError = emailError != null || uiState.error != null || !isEmailValid,
                supportingText = {
                    when {
                        emailError != null -> Text(emailError!!, color = MaterialTheme.colorScheme.error)
                        !isEmailValid -> Text(
                            stringResource(R.string.error_invalid_email),
                            color = MaterialTheme.colorScheme.error
                        )
                        uiState.error != null -> Text(
                            uiState.error!!,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val trimmedEmail = email.trim()
                    if (trimmedEmail.isEmpty()) {
                        emailError = stringResource(R.string.error_email_required)
                        return@Button
                    }
                    if (!EmailValidator.isValidEmail(trimmedEmail)) {
                        emailError = stringResource(R.string.error_invalid_email)
                        return@Button
                    }
                    
                    focusManager.clearFocus()
                    viewModel.sendOtp(trimmedEmail)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isLoading && email.isNotEmpty()
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(stringResource(R.string.btn_send_otp))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = stringResource(R.string.login_terms_notice),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}