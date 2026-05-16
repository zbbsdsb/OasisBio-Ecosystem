package com.oasisbio.app.presentation.viewmodel

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import timber.log.Timber
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap
import kotlin.coroutines.CoroutineContext

abstract class BaseViewModel : ViewModel(), CoroutineScope {

    private val supervisorJob = SupervisorJob()

    override val coroutineContext: CoroutineContext
        get() = Dispatchers.Main + supervisorJob

    private val childJobs = ConcurrentHashMap<String, Job>()

    private val cleanupHandlers = ConcurrentHashMap<String, () -> Unit>()

    private var isCleared = false

    protected fun registerJob(tag: String, job: Job) {
        if (!isCleared) {
            childJobs[tag] = job
        }
    }

    protected fun registerCleanupHandler(tag: String, handler: () -> Unit) {
        if (!isCleared) {
            cleanupHandlers[tag] = handler
        }
    }

    protected fun <T> launchWithTracking(
        tag: String,
        context: CoroutineContext = Dispatchers.IO,
        block: suspend CoroutineScope.() -> T
    ): Job {
        val job = viewModelScope.launch(context) {
            try {
                block()
            } catch (e: Exception) {
                Timber.tag(tag).e(e, "Coroutine failed")
            }
        }
        registerJob(tag, job)
        return job
    }

    protected fun <T> launchIO(
        tag: String = "IO",
        block: suspend CoroutineScope.() -> T
    ): Job {
        return launchWithTracking(tag, Dispatchers.IO, block)
    }

    protected fun <T> launchMain(
        tag: String = "Main",
        block: suspend CoroutineScope.() -> T
    ): Job {
        return launchWithTracking(tag, Dispatchers.Main, block)
    }

    protected fun <T> launchDefault(
        tag: String = "Default",
        block: suspend CoroutineScope.() -> T
    ): Job {
        return launchWithTracking(tag, Dispatchers.Default, block)
    }

    protected fun cancelJob(tag: String) {
        childJobs.remove(tag)?.cancel()
        cleanupHandlers.remove(tag)
    }

    protected fun cancelAllJobs() {
        childJobs.forEach { (_, job) ->
            job.cancel()
        }
        childJobs.clear()
        cleanupHandlers.clear()
    }

    override fun onCleared() {
        if (isCleared) return
        isCleared = true

        cancelAllJobs()

        cleanupHandlers.forEach { (_, handler) ->
            try {
                handler()
            } catch (e: Exception) {
                Timber.e(e, "Cleanup handler failed")
            }
        }
        cleanupHandlers.clear()

        supervisorJob.cancel()

        super.onCleared()
    }

    protected fun isActive(): Boolean = !isCleared && isActive
}

class ViewModelCleaner private constructor() : DefaultLifecycleObserver {

    private val viewModels = ConcurrentHashMap<String, WeakReference<BaseViewModel>>()

    private val scheduledCleanups = ConcurrentHashMap<String, Job>()

    override fun onDestroy(owner: LifecycleOwner) {
        val key = owner.javaClass.name
        viewModels.remove(key)

        scheduledCleanups[key]?.cancel()
        scheduledCleanups.remove(key)
    }

    fun registerViewModel(tag: String, viewModel: BaseViewModel) {
        viewModels[tag] = WeakReference(viewModel)
    }

    fun unregisterViewModel(tag: String) {
        viewModels.remove(tag)
        scheduledCleanups[tag]?.cancel()
        scheduledCleanups.remove(tag)
    }

    fun scheduleCleanup(tag: String, delayMillis: Long = 5000L) {
        scheduledCleanups[tag]?.cancel()

        val job = kotlinx.coroutines.GlobalScope.launch(
            context = Dispatchers.Main + SupervisorJob()
        ) {
            kotlinx.coroutines.delay(delayMillis)
            viewModels.remove(tag)
            scheduledCleanups.remove(tag)
        }
        scheduledCleanups[tag] = job
    }

    fun forceCleanup(tag: String) {
        scheduledCleanups[tag]?.cancel()
        scheduledCleanups.remove(tag)
        viewModels.remove(tag)
    }

    fun cleanupAll() {
        scheduledCleanups.values.forEach { it.cancel() }
        scheduledCleanups.clear()
        viewModels.clear()
    }

    fun getRegisteredCount(): Int = viewModels.size

    companion object {
        @Volatile
        private var instance: ViewModelCleaner? = null

        fun getInstance(): ViewModelCleaner {
            return instance ?: synchronized(this) {
                instance ?: ViewModelCleaner().also { instance = it }
            }
        }
    }
}

object ViewModelMemoryOptimizer {

    private val optimizedViewModels = ConcurrentHashMap<String, OptimizedViewModelState>()

    data class OptimizedViewModelState(
        val tag: String,
        val createdAt: Long = System.currentTimeMillis(),
        var lastAccessed: Long = System.currentTimeMillis(),
        var sizeEstimate: Long = 0
    )

    fun track(tag: String) {
        optimizedViewModels[tag] = OptimizedViewModelState(tag = tag)
    }

    fun updateAccess(tag: String) {
        optimizedViewModels[tag]?.let {
            optimizedViewModels[tag] = it.copy(lastAccessed = System.currentTimeMillis())
        }
    }

    fun untrack(tag: String) {
        optimizedViewModels.remove(tag)
    }

    fun cleanupStaleViewModels(maxAgeMillis: Long = 30 * 60 * 1000L) {
        val currentTime = System.currentTimeMillis()
        optimizedViewModels.entries.removeIf { (_, state) ->
            currentTime - state.lastAccessed > maxAgeMillis
        }
    }

    fun getAllTrackedTags(): Set<String> = optimizedViewModels.keys.toSet()

    fun getTrackedCount(): Int = optimizedViewModels.size

    fun clear() {
        optimizedViewModels.clear()
    }
}

interface MemoryAwareComponent {
    fun onTrimMemory(level: Int)
    fun onLowMemory()
    fun clearMemoryReferences()
}

abstract class MemoryAwareViewModel : BaseViewModel(), MemoryAwareComponent {

    private val memorySensitiveData = ConcurrentHashMap<String, Any?>()

    protected fun <T : Any> storeInMemory(key: String, value: T?) {
        memorySensitiveData[key] = value
    }

    protected fun <T : Any> getFromMemory(key: String): T? {
        @Suppress("UNCHECKED_CAST")
        return memorySensitiveData[key] as? T?
    }

    protected fun clearMemory(key: String) {
        memorySensitiveData.remove(key)
    }

    override fun onTrimMemory(level: Int) {
        when {
            level >= androidx.lifecycle.Lifecycle.Event.ON_PAUSE ->
                clearNonEssentialData()
        }
    }

    override fun onLowMemory() {
        clearAllData()
    }

    override fun clearMemoryReferences() {
        clearAllData()
    }

    protected open fun clearNonEssentialData() {
        memorySensitiveData.entries.removeIf { (_, _) ->
            true
        }
    }

    protected open fun clearAllData() {
        memorySensitiveData.clear()
        cancelAllJobs()
    }
}
