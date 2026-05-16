package com.oasisbio.app.util

import android.content.Context
import leakcanary.AppWatcher
import leakcanary.DefaultOnHeapAnalyzedListener
import leakcanary.HeapAnalysis
import leakcanary.HeapAnalysisFailure
import leakcanary.LeakCanary
import leakcanary.LeakCanary.Config
import leakcanary.OnHeapAnalyzedListener
import leakcanary.ReferenceMatcher
import leakcanary.analyzer.LeakStatus
import leakcanary.analyzer.LeakTraceObject
import leakcanary.internal.InternalLeakCanary
import java.io.File

object LeakCanaryConfig {

    private var isInitialized = false

    fun init(context: Context) {
        if (isInitialized) return
        isInitialized = true

        val config = Config(
            resumeAfterShutdown = true,
            requestWriteExternalStoragePermission = false,
            dumpHeap = true,
            dumpHeapWhenDebugging = true,
            dumpHeapDelayMillis = 10_000L,
            maxStoredHeapDumps = 7,
            retainedVisibleThreshold = 3,
            referenceMatchers = getCustomReferenceMatchers(),
            objectInspectors = emptyList(),
            onHeapAnalyzedListener = createCompositeListener(),
            leakCanaryHeapDumpHandler = InternalLeakCanary.createDefaultHeapDumpHandler(context),
            watchHeapAnalysisDurationMillis = 30_000L,
            maxDurationMillisToKeepHeapAfterHeapDump = 60_000L,
            installExportValve = false,
            exportDir = null,
            computeRetainedHeapSize = true,
            useFileProvider = true
        )

        AppWatcher.manualHeapDump(config)
    }

    private fun getCustomReferenceMatchers(): List<ReferenceMatcher> {
        return listOf(
            ReferenceMatcher.forJdkWeakClassShallowHold(),
            ReferenceMatcher.forJdkWeakClassReference(),
            ReferenceMatcher.forFinalizerClass(),
            ReferenceMatcher.forFinalizerReference(),
            ReferenceMatcher.forSuspectThatReachableInstancesLeak()
        )
    }

    private fun createCompositeListener(): OnHeapAnalyzedListener {
        return OnHeapAnalyzedListener { analysis ->
            when (analysis) {
                is HeapAnalysisFailure -> {
                    handleHeapAnalysisFailure(analysis)
                }
                is HeapAnalysis -> {
                    handleHeapAnalysisSuccess(analysis)
                }
            }
            DefaultOnHeapAnalyzedListener.onHeapAnalyzed(analysis)
        }
    }

    private fun handleHeapAnalysisFailure(analysis: HeapAnalysisFailure) {
        Timber.e(analysis.exception, "Heap analysis failed")
    }

    private fun handleHeapAnalysisSuccess(analysis: HeapAnalysis) {
        val leakSignatures = analysis.allLeakSignatures
        if (leakSignatures.isNotEmpty()) {
            Timber.w("LeakCanary: Found ${leakSignatures.size} leak signatures")
            leakSignatures.forEach { signature ->
                Timber.tag("LeakCanary").d("Leak: ${signature.classSimpleName} - ${signature.leakTrace.keyedWeakUptimeMillis}")
            }
        }

        analysis.applicationLeaks.forEach { leak ->
            analyzeLeakTrace(leak.leakTrace, leak.leakStatus, leak.leakTrace.classSimpleName)
        }
    }

    private fun analyzeLeakTrace(
        leakTrace: LeakTraceObject,
        leakStatus: LeakStatus,
        className: String
    ) {
        if (leakStatus == LeakStatus.UNREACHABLE || leakStatus == LeakStatus.UNKNOWN) {
            Timber.tag("LeakCanary").d("Potentially false positive: $className")
            return
        }

        var current: LeakTraceObject? = leakTrace
        val exclusionReasons = mutableListOf<String>()
        var depth = 0
        val maxDepth = 10

        while (current != null && depth < maxDepth) {
            current.owningObj?.let { obj ->
                if (obj.referenceName != null) {
                    val reason = "${obj.classSimpleName}.${obj.referenceName}"
                    if (!exclusionReasons.contains(reason)) {
                        exclusionReasons.add(reason)
                    }
                }
            }
            current = current.parent
            depth++
        }

        if (exclusionReasons.isNotEmpty()) {
            Timber.tag("LeakCanary").d("Common leak pattern in $className: $exclusionReasons")
        }
    }
}

class CustomLeakRules {

    companion object {
        val ACTIVITY_CONTEXT_PATTERNS = listOf(
            "com.oasisbio.app.presentation.ui.screens."
        )

        val IGNORED_CLASSES = listOf(
            "android.app.Activity",
            "android.view.View",
            "androidx.fragment.app.Fragment",
            "androidx.lifecycle.ViewModel",
            "kotlin.jvm.internal.PropertyReference"
        )

        val SUSPECTED_LEAK_PATTERNS = listOf(
            "mContext",
            "this\$0",
            "this\$activity",
            "view$delegate",
            "_toolbar"
        )
    }

    fun shouldIgnoreLeak(leakTrace: LeakTraceObject, className: String): Boolean {
        if (IGNORED_CLASSES.any { leakTrace.classSimpleName.startsWith(it) }) {
            return true
        }

        if (SUSPECTED_LEAK_PATTERNS.any { pattern ->
            leakTrace.toString().contains(pattern)
        }) {
            return true
        }

        return false
    }

    fun categorizeLeak(leakTrace: LeakTraceObject): LeakCategory {
        val traceString = leakTrace.toString().lowercase()

        return when {
            traceString.contains("handler") || traceString.contains("looper") -> LeakCategory.HANDLER
            traceString.contains("callback") || traceString.contains("listener") -> LeakCategory.CALLBACK
            traceString.contains("context") || traceString.contains("activity") -> LeakCategory.CONTEXT
            traceString.contains("viewmodel") || traceString.contains("view model") -> LeakCategory.VIEWMODEL
            traceString.contains("coroutine") || traceString.contains("job") -> LeakCategory.COROUTINE
            traceString.contains("static") -> LeakCategory.STATIC
            else -> LeakCategory.OTHER
        }
    }
}

enum class LeakCategory {
    ACTIVITY,
    CONTEXT,
    VIEWMODEL,
    HANDLER,
    CALLBACK,
    COROUTINE,
    STATIC,
    OTHER
}

object LeakCanaryHelper {

    private val customLeakRules = CustomLeakRules()

    fun isActivityLeak(analysis: HeapAnalysis, activityClassPrefix: String): Boolean {
        return analysis.allLeakSignatures.any { signature ->
            signature.classSimpleName.startsWith(activityClassPrefix)
        }
    }

    fun getLeakSummary(analysis: HeapAnalysis): LeakSummary {
        val leakSignatures = analysis.allLeakSignatures
        val categoryCount = mutableMapOf<LeakCategory, Int>()

        leakSignatures.forEach { signature ->
            val category = customLeakRules.categorizeLeak(signature.leakTrace)
            categoryCount[category] = (categoryCount[category] ?: 0) + 1
        }

        return LeakSummary(
            totalLeaks = leakSignatures.size,
            applicationLeaks = analysis.applicationLeaks.size,
            libraryLeaks = analysis.libraryLeaks.size,
            categoryBreakdown = categoryCount
        )
    }

    fun forceGarbageCollectionAndDump() {
        System.gc()
        System.runFinalization()
        System.gc()
        Thread.sleep(2000)
        AppWatcher.dumpHeap()
    }

    fun getLeakCanaryInternalHandler(): InternalLeakCanary {
        return InternalLeakCanary.getInstance()
    }
}

data class LeakSummary(
    val totalLeaks: Int,
    val applicationLeaks: Int,
    val libraryLeaks: Int,
    val categoryBreakdown: Map<LeakCategory, Int>
) {
    fun toFormattedString(): String {
        return buildString {
            appendLine("=== Leak Summary ===")
            appendLine("Total Leaks: $totalLeaks")
            appendLine("Application Leaks: $applicationLeaks")
            appendLine("Library Leaks: $libraryLeaks")
            if (categoryBreakdown.isNotEmpty()) {
                appendLine("\nCategory Breakdown:")
                categoryBreakdown.forEach { (category, count) ->
                    appendLine("  $category: $count")
                }
            }
        }
    }
}
