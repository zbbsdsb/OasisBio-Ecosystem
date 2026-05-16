package com.oasisbio.app.util

object EmailValidator {
    private val EMAIL_REGEX = Regex(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    )

    fun isValidEmail(email: String): Boolean {
        return email.isNotBlank() && EMAIL_REGEX.matches(email)
    }

    fun isValidEmailOrEmpty(email: String): Boolean {
        return email.isEmpty() || isValidEmail(email)
    }
}
