package com.oasisbio.app.data.remote.interceptor

import android.content.Context
import com.oasisbio.app.util.MetricType
import com.oasisbio.app.util.PerformanceMetric
import com.oasisbio.app.util.PerformanceMonitor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.Interceptor
import okhttp3.Response
import android.os.SystemClock
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PerformanceMonitoringInterceptor @Inject constructor(
    private val performanceMonitor: PerformanceMonitor
) : Interceptor {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val requestTag = generateRequestTag(request)
        val startTime = SystemClock.elapsedRealtime()

        performanceMonitor.startOperation(requestTag)

        return try {
            val response = chain.proceed(request)
            val duration = SystemClock.elapsedRealtime() - startTime

            val metric = PerformanceMetric(
                type = MetricType.API_RESPONSE,
                name = requestTag,
                durationMs = duration,
                metadata = buildMetadata(request, response, duration)
            )

            recordMetric(metric)
            performanceMonitor.stopOperation(requestTag)

            response
        } catch (e: Exception) {
            val duration = SystemClock.elapsedRealtime() - startTime

            val metric = PerformanceMetric(
                type = MetricType.API_RESPONSE,
                name = requestTag,
                durationMs = duration,
                metadata = buildErrorMetadata(request, e, duration)
            )

            recordMetric(metric)
            performanceMonitor.stopOperation(requestTag)

            throw e
        }
    }

    private fun generateRequestTag(request: okhttp3.Request): String {
        val method = request.method
        val path = request.url.encodedPath
        val query = request.url.queryParameterNames.take(3).joinToString(",") { "$it=${request.url.queryParameter(it)}" }
        return if (query.isNotEmpty()) {
            "$method|$path?$query"
        } else {
            "$method|$path"
        }
    }

    private fun buildMetadata(
        request: okhttp3.Request,
        response: Response,
        duration: Long
    ): Map<String, String> {
        return mapOf(
            "url" to request.url.toString(),
            "method" to request.method,
            "status_code" to response.code.toString(),
            "cache_hit" to (response.networkResponse == null).toString(),
            "duration_ms" to duration.toString(),
            "response_size" to (response.body?.contentLength() ?: 0).toString()
        )
    }

    private fun buildErrorMetadata(
        request: okhttp3.Request,
        error: Exception,
        duration: Long
    ): Map<String, String> {
        return mapOf(
            "url" to request.url.toString(),
            "method" to request.method,
            "error_type" to error.javaClass.simpleName,
            "error_message" to (error.message ?: "Unknown error"),
            "duration_ms" to duration.toString(),
            "success" to "false"
        )
    }

    private fun recordMetric(metric: PerformanceMetric) {
        scope.launch {
            performanceMonitor.recordCustomMetric(
                name = metric.name,
                value = metric.durationMs.toDouble(),
                metadata = metric.metadata
            )
        }
    }

    companion object {
        @Volatile
        private var instance: PerformanceMonitoringInterceptor? = null

        fun getInstance(context: Context): PerformanceMonitoringInterceptor {
            return instance ?: synchronized(this) {
                instance ?: PerformanceMonitoringInterceptor(
                    PerformanceMonitor.getInstance(context)
                ).also { instance = it }
            }
        }
    }
}
