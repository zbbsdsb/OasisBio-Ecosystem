package com.oasisbio.app.data.remote

sealed class Result<out T> {
    data class Success<out T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable, val message: String? = null) : Result<Nothing>()

    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error

    fun getOrNull(): T? = when (this) {
        is Success -> data
        is Error -> null
    }

    fun exceptionOrNull(): Throwable? = when (this) {
        is Success -> null
        is Error -> exception
    }

    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
    }

    inline fun onSuccess(action: (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }

    inline fun onFailure(action: (Throwable, String?) -> Unit): Result<T> {
        if (this is Error) action(exception, message)
        return this
    }

    companion object {
        inline fun <T> runCatching(block: () -> T): Result<T> {
            return try {
                Success(block())
            } catch (e: Throwable) {
                Error(e)
            }
        }
    }
}

inline fun <T> Result<T>.getOrElse(default: T): T = when (this) {
    is Result.Success -> data
    is Result.Error -> default
}

inline fun <T> Result<T>.getOrThrow(): T = when (this) {
    is Result.Success -> data
    is Result.Error -> throw exception
}

fun <T> Result<T>.toKotlinResult(): kotlin.Result<T> = when (this) {
    is Result.Success -> kotlin.Result.success(data)
    is Result.Error -> kotlin.Result.failure(exception)
}
