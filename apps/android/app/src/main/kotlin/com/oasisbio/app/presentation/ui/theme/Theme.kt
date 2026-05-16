package com.oasisbio.app.presentation.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF006D3B),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF98F7B0),
    onPrimaryContainer = Color(0xFF002110),
    secondary = Color(0xFF526351),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFD4E8D0),
    onSecondaryContainer = Color(0xFF101F12),
    tertiary = Color(0xFF39656B),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFBCEAF2),
    onTertiaryContainer = Color(0xFF001F24),
    error = Color(0xFFBA1A1A),
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    background = Color(0xFFFCFDF7),
    onBackground = Color(0xFF1A1C19),
    surface = Color(0xFFFCFDF7),
    onSurface = Color(0xFF1A1C19),
    surfaceVariant = Color(0xFFDEE5D9),
    onSurfaceVariant = Color(0xFF424940),
    outline = Color(0xFF72796F),
    inverseOnSurface = Color(0xFFF0F1EB),
    inverseSurface = Color(0xFF2F312D),
    inversePrimary = Color(0xFF7EDA9A)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF7EDA9A),
    onPrimary = Color(0xFF00391C),
    primaryContainer = Color(0xFF00522B),
    onPrimaryContainer = Color(0xFF98F7B0),
    secondary = Color(0xFFB9CCB4),
    onSecondary = Color(0xFF253425),
    secondaryContainer = Color(0xFF3A4B3A),
    onSecondaryContainer = Color(0xFFD4E8D0),
    tertiary = Color(0xFFA1CED5),
    onTertiary = Color(0xFF00363C),
    tertiaryContainer = Color(0xFF1F4D53),
    onTertiaryContainer = Color(0xFFBCEAF2),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = Color(0xFF1A1C19),
    onBackground = Color(0xFFE2E3DE),
    surface = Color(0xFF1A1C19),
    onSurface = Color(0xFFE2E3DE),
    surfaceVariant = Color(0xFF424940),
    onSurfaceVariant = Color(0xFFC2C9BD),
    outline = Color(0xFF8C9387),
    inverseOnSurface = Color(0xFF1A1C19),
    inverseSurface = Color(0xFFE2E3DE),
    inversePrimary = Color(0xFF006D3B)
)

@Composable
fun OasisBioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(LocalView.current.context)
            else dynamicLightColorScheme(LocalView.current.context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
