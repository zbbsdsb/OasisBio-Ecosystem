package com.oasisbio.app.data.remote.interceptor

import okhttp3.Interceptor
import okhttp3.Response
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

class RequestDeduplicationInterceptor(
    private val deduplicationWindowMs: Long = DEFAULT_DEDUPLICATION_WINDOW_MS
) : Interceptor {

    private val inFlightRequests = ConcurrentHashMap<String, InFlightRequest>()
    private val requestCounts = ConcurrentHashMap<String, AtomicInteger>()

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val cacheKey = generateCacheKey(originalRequest)

        val existingRequest = inFlightRequests[cacheKey]
        if (existingRequest != null && existingRequest.isCompleted()) {
            existingRequest.waitForCompletion()
            return existingRequest.getResponse() ?: throw existingRequest.getException()
                ?: throw IllegalStateException("No response available")
        }

        val newRequest = InFlightRequest(chain, cacheKey)
        val existing = inFlightRequests.putIfAbsent(cacheKey, newRequest)

        return if (existing != null) {
            newRequest.cleanup()
            existing.waitForCompletion()
            existing.getResponse() ?: throw existing.getException()
                ?: throw IllegalStateException("No response available")
        } else {
            incrementRequestCount(cacheKey)
            try {
                val response = chain.proceed(originalRequest)
                newRequest.setResponse(response)
                response
            } catch (e: Exception) {
                newRequest.setException(e)
                throw e
            } finally {
                newRequest.markCompleted()
            }
        }
    }

    private fun generateCacheKey(request: okhttp3.Request): String {
        val method = request.method
        val url = request.url.toString()
        val bodyHash = request.body?.let { body ->
            val buffer = okio.Buffer()
            body.writeTo(buffer)
            buffer.readUtf8().hashCode()
        } ?: 0
        return "$method|$url|$bodyHash"
    }

    private fun incrementRequestCount(cacheKey: String) {
        requestCounts.computeIfAbsent(cacheKey) { AtomicInteger(0) }.incrementAndGet()
    }

    fun getInFlightRequestCount(): Int = inFlightRequests.size

    fun getTotalRequestCount(cacheKey: String): Int =
        requestCounts[cacheKey]?.get() ?: 0

    fun clear() {
        inFlightRequests.clear()
        requestCounts.clear()
    }

    private class InFlightRequest(
        private val chain: Interceptor.Chain,
        private val cacheKey: String
    ) {
        @Volatile
        private var response: Response? = null
        @Volatile
        private var exception: Exception? = null
        @Volatile
        private var completed = false
        private val lock = Object()

        @Synchronized
        fun setResponse(res: Response) {
            this.response = res
        }

        @Synchronized
        fun setException(e: Exception) {
            this.exception = e
        }

        @Synchronized
        fun markCompleted() {
            this.completed = true
            inFlightRequests.remove(cacheKey)
            synchronized(lock) {
                lock.notifyAll()
            }
        }

        fun isCompleted(): Boolean = completed

        fun getResponse(): Response? = response

        fun getException(): Exception? = exception

        fun waitForCompletion() {
            synchronized(lock) {
                while (!completed) {
                    try {
                        lock.wait()
                    } catch (e: InterruptedException) {
                        Thread.currentThread().interrupt()
                        break
                    }
                }
            }
        }

        fun cleanup() {
            inFlightRequests.remove(cacheKey)
        }
    }

    companion object {
        private const val DEFAULT_DEDUPLICATION_WINDOW_MS = 5000L

        @Volatile
        private var instance: RequestDeduplicationInterceptor? = null

        fun getInstance(): RequestDeduplicationInterceptor {
            return instance ?: synchronized(this) {
                instance ?: RequestDeduplicationInterceptor().also { instance = it }
            }
        }

        fun clearInstance() {
            instance?.clear()
            instance = null
        }
    }
}
