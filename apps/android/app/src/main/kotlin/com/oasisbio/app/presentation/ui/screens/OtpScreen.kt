package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.presentation.navigation.NavigationRoutes
import com.oasisbio.app.presentation.viewmodel.AuthViewModel

@Composable
fun OtpScreen(
    navController: NavHostController,
    email: String,
    onNavigateToLogin: () -> Unit
) {
    val viewModel: AuthViewModel = hiltViewModel()
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

    var otpCode by remember { mutableStateOf(List(6) { "" }) }
    val focusRequesters = remember { List(6) { FocusRequester() } }

    LaunchedEffect(Unit) {
        focusRequesters[0].requestFocus()
    }

    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            navController.navigate(NavigationRoutes.IDENTITIES) {
                popUpTo(NavigationRoutes.WELCOME) { inclusive = true }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.title_otp_verification)) },
                navigationIcon = {
                    IconButton(onClick = {
                        viewModel.resetOtpState()
                        onNavigateToLogin()
                    }) {
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
                text = stringResource(R.string.otp_title),
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = stringResource(R.string.otp_subtitle, email),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                otpCode.forEachIndexed { index, digit ->
                    OtpDigitBox(
                        value = digit,
                        onValueChange = { newValue ->
                            if (newValue.length <= 1 && newValue.all { it.isDigit() }) {
                                val newOtpCode = otpCode.toMutableList()
                                newOtpCode[index] = newValue
                                otpCode = newOtpCode

                                if (newValue.isNotEmpty() && index < 5) {
                                    focusRequesters[index + 1].requestFocus()
                                }

                                if (otpCode.all { it.isNotEmpty() }) {
                                    focusManager.clearFocus()
                                }
                            }
                        },
                        focusRequester = focusRequesters[index],
                        isError = uiState.error != null
                    )
                }
            }

            if (uiState.error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = uiState.error ?: "",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = {
                    val code = otpCode.joinToString("")
                    viewModel.verifyOtp(code)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isLoading && otpCode.all { it.isNotEmpty() }
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(stringResource(R.string.btn_verify))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (uiState.countdown > 0) {
                Text(
                    text = stringResource(R.string.otp_resend_countdown, uiState.countdown),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                TextButton(
                    onClick = {
                        otpCode = List(6) { "" }
                        viewModel.sendOtp(email)
                        LaunchedEffect(Unit) {
                            focusRequesters[0].requestFocus()
                        }
                    },
                    enabled = !uiState.isLoading
                ) {
                    Text(stringResource(R.string.btn_resend_otp))
                }
            }
        }
    }
}

@Composable
private fun OtpDigitBox(
    value: String,
    onValueChange: (String) -> Unit,
    focusRequester: FocusRequester,
    isError: Boolean
) {
    val borderColor = when {
        isError -> MaterialTheme.colorScheme.error
        value.isNotEmpty() -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.outline
    }

    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier
            .size(48.dp)
            .border(2.dp, borderColor, RoundedCornerShape(8.dp))
            .background(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(8.dp)
            )
            .focusRequester(focusRequester),
        textStyle = MaterialTheme.typography.headlineSmall.copy(
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurface
        ),
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Number,
            imeAction = ImeAction.Next
        ),
        keyboardActions = KeyboardActions(
            onNext = { }
        ),
        singleLine = true,
        cursorBrush = SolidColor(MaterialTheme.colorScheme.primary),
        decorationBox = { innerTextField ->
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                innerTextField()
            }
        }
    )
}
