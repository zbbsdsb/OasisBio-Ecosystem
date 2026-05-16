package com.oasisbio.app.presentation.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assistant
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Globe
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.oasisbio.app.presentation.ui.screens.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavHost(navController: NavHostController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val isAuthRoute = listOf(
        NavigationRoutes.WELCOME,
        NavigationRoutes.LOGIN,
        NavigationRoutes.OTP,
        NavigationRoutes.REGISTER
    ).contains(currentRoute)

    Scaffold(
        bottomBar = {
            if (!isAuthRoute) {
                BottomNavigationBar(
                    navController = navController,
                    currentRoute = currentRoute
                )
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = NavigationRoutes.WELCOME,
            modifier = Modifier.padding(padding)
        ) {
            composable(NavigationRoutes.WELCOME) {
                WelcomeScreen(navController = navController)
            }
            composable(NavigationRoutes.LOGIN) {
                LoginScreen(navController = navController)
            }
            composable(
                route = NavigationRoutes.OTP,
                arguments = listOf(
                    navArgument("email") {
                        nullable = true
                        defaultValue = null
                    }
                )
            ) { backStackEntry ->
                val email = backStackEntry.arguments?.getString("email") ?: ""
                OtpScreen(
                    navController = navController,
                    email = email,
                    onNavigateToLogin = {
                        navController.popBackStack(NavigationRoutes.LOGIN, false)
                    }
                )
            }
            composable(NavigationRoutes.REGISTER) {
                RegisterScreen(navController = navController)
            }
            composable(NavigationRoutes.IDENTITIES) {
                IdentityListScreen(navController = navController)
            }
            composable(
                route = NavigationRoutes.IDENTITY_DETAIL,
                arguments = listOf(navArgument("id") { defaultValue = "" })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                IdentityDetailScreen(navController = navController, identityId = id)
            }
            composable(NavigationRoutes.CREATE_IDENTITY) {
                CreateIdentityScreen(navController = navController)
            }
            composable(
                route = NavigationRoutes.EDIT_IDENTITY,
                arguments = listOf(navArgument("id") { defaultValue = "" })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                EditIdentityScreen(navController = navController, identityId = id)
            }
            composable(NavigationRoutes.WORLD_LIST) {
                WorldListScreen(navController = navController)
            }
            composable(
                route = NavigationRoutes.WORLD_DETAIL,
                arguments = listOf(navArgument("id") { defaultValue = "" })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: ""
                WorldDetailScreen(navController = navController, worldId = id)
            }
            composable(NavigationRoutes.WORLD_BUILDER) {
                WorldWizardScreen(navController = navController)
            }
            composable(NavigationRoutes.DASHBOARD) {
                DashboardScreen(navController = navController)
            }
            composable(NavigationRoutes.SETTINGS) {
                SettingsScreen(navController = navController)
            }
            composable(NavigationRoutes.ASSISTANT) {
                ChatScreen(navController = navController)
            }
        }
    }
}

@Composable
private fun BottomNavigationBar(
    navController: NavHostController,
    currentRoute: String?
) {
    val items = listOf(
        BottomNavItem(
            route = NavigationRoutes.DASHBOARD,
            label = "仪表盘",
            icon = Icons.Default.Dashboard
        ),
        BottomNavItem(
            route = NavigationRoutes.IDENTITIES,
            label = "身份",
            icon = Icons.Default.Person
        ),
        BottomNavItem(
            route = NavigationRoutes.ASSISTANT,
            label = "助手",
            icon = Icons.Default.Assistant
        ),
        BottomNavItem(
            route = NavigationRoutes.WORLD_LIST,
            label = "世界",
            icon = Icons.Default.Globe
        ),
        BottomNavItem(
            route = NavigationRoutes.SETTINGS,
            label = "设置",
            icon = Icons.Default.Settings
        )
    )

    NavigationBar {
        items.forEach { item ->
            val isSelected = currentRoute == item.route || 
                (item.route == NavigationRoutes.IDENTITIES && 
                    (currentRoute?.startsWith("identity_") == true)) ||
                (item.route == NavigationRoutes.WORLD_LIST && 
                    (currentRoute?.startsWith("world_") == true))
            
            NavigationBarItem(
                selected = isSelected,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo(NavigationRoutes.DASHBOARD) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    Icon(item.icon, contentDescription = item.label)
                },
                label = {
                    Text(item.label)
                }
            )
        }
    }
}

private data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)