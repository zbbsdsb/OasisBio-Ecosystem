package com.oasisbio.app.data.remote.job

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CoroutineJobManager @Inject constructor() {

    private val jobs = ConcurrentHashMap<String, Job>()
    private val scope = CoroutineScope(SupervisorJob())

    fun register(tag: String, job: Job) {
        jobs[tag]?.cancel()
        jobs[tag] = job
    }

    fun cancel(tag: String) {
        jobs.remove(tag)?.cancel()
    }

    fun cancelAll() {
        jobs.values.forEach { it.cancel() }
        jobs.clear()
    }

    fun cancelAllWithPrefix(prefix: String) {
        val keysToCancel = jobs.keys.filter { it.startsWith(prefix) }
        keysToCancel.forEach { key ->
            jobs.remove(key)?.cancel()
        }
    }

    fun isActive(tag: String): Boolean {
        val job = jobs[tag]
        return job != null && job.isActive
    }

    fun getActiveCount(): Int = jobs.count { it.value.isActive }

    fun getAllTags(): Set<String> = jobs.keys.toSet()

    fun launch(tag: String, block: suspend CoroutineScope.() -> Unit): Job {
        val job = scope.launch(block = block)
        register(tag, job)
        return job
    }

    suspend fun awaitCompletion(tag: String) {
        jobs[tag]?.join()
    }

    fun remove(tag: String) {
        jobs.remove(tag)
    }

    fun getJob(tag: String): Job? = jobs[tag]
}

@DslMarker
annotation class JobManagerDsl

@JobManagerDsl
class JobManagerBuilder(private val manager: CoroutineJobManager) {
    private val tags = mutableListOf<String>()

    fun add(tag: String, block: suspend CoroutineScope.() -> Unit): JobManagerBuilder {
        tags.add(tag)
        manager.launch(tag, block)
        return this
    }

    fun build(): List<Job> = tags.mapNotNull { manager.getJob(it) }
}

fun CoroutineJobManager.builder(block: JobManagerBuilder.() -> Unit): List<Job> {
    return JobManagerBuilder(this).apply(block).build()
}
