package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Globe
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OAuthDocsScreen(navController: NavHostController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("OAuth Integration Guide") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "OAuth Integration Guide",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Learn how to integrate \"Continue with Oasis\" login into your application",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            item {
                QuickStartSection()
            }

            item {
                IntegrationCodeSection()
            }

            item {
                AvailableScopesSection()
            }

            item {
                SecurityBestPracticesSection()
            }

            item {
                ApiEndpointsSection()
            }

            item {
                CallToActionSection(navController)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun QuickStartSection() {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Book,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Quick Start",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Follow these steps to integrate OAuth authentication into your application:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickStartItem(
                    step = 1,
                    title = "Register your application",
                    description = "in the Developer Portal to get your client_id"
                )
                QuickStartItem(
                    step = 2,
                    title = "Implement PKCE flow",
                    description = "to generate code_verifier and code_challenge"
                )
                QuickStartItem(
                    step = 3,
                    title = "Redirect users",
                    description = "to the OasisBio authorization endpoint"
                )
                QuickStartItem(
                    step = 4,
                    title = "Exchange the authorization code",
                    description = "for access and refresh tokens"
                )
                QuickStartItem(
                    step = 5,
                    title = "Use the access token",
                    description = "to call protected API endpoints"
                )
            }
        }
    }
}

@Composable
private fun QuickStartItem(step: Int, title: String, description: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "$step.",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.width(24.dp)
        )
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun IntegrationCodeSection() {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Code,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Integration Code",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            CodeBlock(
                title = "1. Authorization URL Generation",
                code = """val authUrl = URL("${'$'}OAUTH_API_URL/authorize").apply {
    searchParams.set("client_id", YOUR_CLIENT_ID)
    searchParams.set("redirect_uri", YOUR_REDIRECT_URI)
    searchParams.set("scope", "profile email oasisbios:read")
    searchParams.set("state", generateRandomState())
    searchParams.set("code_challenge", codeChallenge)
    searchParams.set("code_challenge_method", "S256")
}

// Redirect user
startActivity(Intent(Intent.ACTION_VIEW, authUrl.toUri()))"""
            )

            Spacer(modifier = Modifier.height(16.dp))

            CodeBlock(
                title = "2. Token Exchange",
                code = """val response = ktorClient.post("${'$'}OAUTH_API_URL/token") {
    contentType(ContentType.Application.Json)
    setBody(buildJsonObject {
        put("grant_type", "authorization_code")
        put("code", authorizationCode)
        put("redirect_uri", YOUR_REDIRECT_URI)
        put("code_verifier", codeVerifier)
        put("client_id", YOUR_CLIENT_ID)
    })
}

val tokens = response.body<OAuthTokens>()"""
            )

            Spacer(modifier = Modifier.height(16.dp))

            CodeBlock(
                title = "3. Refresh Token",
                code = """val response = ktorClient.post("${'$'}OAUTH_API_URL/token") {
    contentType(ContentType.Application.Json)
    setBody(buildJsonObject {
        put("grant_type", "refresh_token")
        put("refresh_token", refreshToken)
        put("client_id", YOUR_CLIENT_ID)
    })
}"""
            )
        }
    }
}

@Composable
private fun CodeBlock(title: String, code: String) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Text(
                text = code,
                style = MaterialTheme.typography.bodySmall,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(12.dp)
            )
        }
    }
}

@Composable
private fun AvailableScopesSection() {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Key,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Available Scopes",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val scopes = listOf(
                ScopeInfo("profile", "Profile", "User ID, username, display name, avatar"),
                ScopeInfo("email", "Email", "User email address"),
                ScopeInfo("oasisbios:read", "Character List", "Public character list (title, slug, tagline, cover image)"),
                ScopeInfo("oasisbios:full", "Full Character Data", "Complete character data with abilities, worlds, eras"),
                ScopeInfo("dcos:read", "DCOS Documents", "Character DCOS document content")
            )

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                scopes.forEach { scope ->
                    ScopeItem(scope = scope)
                }
            }
        }
    }
}

private data class ScopeInfo(
    val scope: String,
    val label: String,
    val description: String
)

@Composable
private fun ScopeItem(scope: ScopeInfo) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surfaceVariant
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Text(
                    text = scope.scope,
                    style = MaterialTheme.typography.labelMedium,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            Column {
                Text(
                    text = scope.label,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = scope.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun SecurityBestPracticesSection() {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Shield,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Security Best Practices",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val practices = listOf(
                "Always use PKCE (S256 method) for authorization requests",
                "Validate the state parameter to prevent CSRF attacks",
                "Store tokens securely (never in localStorage for mobile apps)",
                "Implement refresh token rotation",
                "Use HTTPS for all OAuth communications",
                "Validate redirect URIs exactly (no wildcards in production)"
            )

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                practices.forEach { practice ->
                    PracticeItem(text = practice)
                }
            }
        }
    }
}

@Composable
private fun PracticeItem(text: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "✓",
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun ApiEndpointsSection() {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Globe,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "API Endpoints",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val endpoints = listOf(
                EndpointInfo("GET", "/oauth/authorize", "Authorization endpoint"),
                EndpointInfo("POST", "/oauth/token", "Token exchange & refresh"),
                EndpointInfo("GET", "/oauth/userinfo", "Get user profile"),
                EndpointInfo("POST", "/oauth/revoke", "Revoke tokens"),
                EndpointInfo("GET", "/oauth/.well-known/openid-configuration", "OIDC discovery")
            )

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                endpoints.forEach { endpoint ->
                    EndpointItem(endpoint = endpoint)
                }
            }
        }
    }
}

private data class EndpointInfo(
    val method: String,
    val endpoint: String,
    val description: String
)

@Composable
private fun EndpointItem(endpoint: EndpointInfo) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            shape = RoundedCornerShape(4.dp),
            color = if (endpoint.method == "GET") {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.secondaryContainer
            }
        ) {
            Text(
                text = endpoint.method,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = if (endpoint.method == "GET") {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onSecondaryContainer
                },
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
        Text(
            text = endpoint.endpoint,
            style = MaterialTheme.typography.bodyMedium,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = endpoint.description,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun CallToActionSection(navController: NavHostController) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Try the \"Continue with Oasis\" Button",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Experience the OAuth flow firsthand",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    navController.navigate(NavigationRoutes.DASHBOARD)
                }
            ) {
                Text("Go to Dashboard")
            }
        }
    }
}
