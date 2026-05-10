package com.oasisbio.app.presentation.ui.screens

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.oasisbio.app.R

@Composable
fun EmptyIdentities() {
    Text(stringResource(R.string.empty_identities))
}