package com.oasisbio.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.oasisbio.app.presentation.ui.screens.*

@Composable
fun AppNavHost(navController: NavHostController) {
    NavHost(navController = navController, startDestination = NavigationRoutes.WELCOME) {
        composable(NavigationRoutes.WELCOME) {
            WelcomeScreen(navController = navController)
        }
        composable(NavigationRoutes.LOGIN) {
            LoginScreen(navController = navController)
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
    }
}