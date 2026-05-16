package com.oasisbio.app.data.remote

sealed class ApiException(
    message: String,
    val code: Int? = null,
    val errorBody: String? = null
) : Exception(message) {
    class Unauthorized(message: String = "Unauthorized access") : ApiException(message, 401)
    class Forbidden(message: String = "Access forbidden") : ApiException(message, 403)
    class NotFound(message: String = "Resource not found") : ApiException(message, 404)
    class ServerError(message: String = "Internal server error", code: Int = 500) : ApiException(message, code)
    class BadRequest(message: String, errorBody: String? = null) : ApiException(message, 400, errorBody)
    class NetworkError(message: String) : ApiException(message)
    class UnknownError(message: String) : ApiException(message)
}
