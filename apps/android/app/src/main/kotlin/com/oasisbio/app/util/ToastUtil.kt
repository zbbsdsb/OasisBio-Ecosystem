package com.oasisbio.app.util

import android.content.Context
import android.widget.Toast
import androidx.annotation.StringRes
import kotlinx.coroutines.android.awaitFrame

object ToastUtil {
    private var lastToast: Toast? = null

    fun showSuccess(context: Context, message: String, duration: Int = Toast.LENGTH_SHORT) {
        showToast(context, message, duration, isError = false)
    }

    fun showSuccess(context: Context, @StringRes messageRes: Int, duration: Int = Toast.LENGTH_SHORT) {
        showToast(context, context.getString(messageRes), duration, isError = false)
    }

    fun showError(context: Context, message: String, duration: Int = Toast.LENGTH_LONG) {
        showToast(context, message, duration, isError = true)
    }

    fun showError(context: Context, @StringRes messageRes: Int, duration: Int = Toast.LENGTH_LONG) {
        showToast(context, context.getString(messageRes), duration, isError = true)
    }

    fun showInfo(context: Context, message: String, duration: Int = Toast.LENGTH_SHORT) {
        showToast(context, message, duration, isError = false)
    }

    fun showInfo(context: Context, @StringRes messageRes: Int, duration: Int = Toast.LENGTH_SHORT) {
        showToast(context, context.getString(messageRes), duration, isError = false)
    }

    private fun showToast(context: Context, message: String, duration: Int, isError: Boolean) {
        lastToast?.cancel()
        val toast = Toast.makeText(context, message, duration)
        toast.show()
        lastToast = toast
    }

    fun cancel() {
        lastToast?.cancel()
        lastToast = null
    }
}

suspend fun awaitFrame() = awaitFrame()
