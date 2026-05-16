package com.oasisbio.app.data.remote

import com.google.gson.Gson
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ErrorInterceptor @Inject constructor() : Interceptor {

    private val gson = Gson()

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)

        if (!response.isSuccessful) {
            val errorBody = response.body?.string()
            val errorMessage = parseErrorMessage(errorBody)

            val exception = when (response.code) {
                401 -> ApiException.Unauthorized(errorMessage)
                403 -> ApiException.Forbidden(errorMessage)
                404 -> ApiException.NotFound(errorMessage)
                in 400..499 -> ApiException.BadRequest(errorMessage, errorBody)
                in 500..599 -> ApiException.ServerError(errorMessage, response.code)
                else -> ApiException.UnknownError(errorMessage)
            }

            throw exception
        }

        return response
    }

    private fun parseErrorMessage(errorBody: String?): String {
        if (errorBody.isNullOrEmpty()) {
            return "Unknown error occurred"
        }

        return try {
            val errorResponse = gson.fromJson(errorBody, ErrorResponse::class.java)
            errorResponse.message ?: errorResponse.error ?: "Unknown error occurred"
        } catch (e: Exception) {
            errorBody
        }
    }

    private data class ErrorResponse(
        val message: String? = null,
        val error: String? = null,
        val error_description: String? = null
    )
}
