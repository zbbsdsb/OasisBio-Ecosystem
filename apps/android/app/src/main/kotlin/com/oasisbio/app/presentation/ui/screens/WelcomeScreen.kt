package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.presentation.navigation.NavigationRoutes

@Composable
fun WelcomeScreen(navController: NavHostController) {
    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 32.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_app_logo),
                contentDescription = stringResource(R.string.app_logo_description),
                modifier = Modifier.size(160.dp),
                contentScale = ContentScale.Fit
            )

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = stringResource(R.string.welcome_title),
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = stringResource(R.string.welcome_subtitle),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(64.dp))
            
            Button(
                onClick = { navController.navigate(NavigationRoutes.LOGIN) },
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.medium
            ) {
                Text(text = stringResource(R.string.btn_start))
            }
        }
    }
}