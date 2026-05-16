import Foundation
import os.log

struct PerformanceMetric: Identifiable, Codable, Sendable {
    let id: UUID
    let name: String
    let startTime: Date
    let endTime: Date?
    let duration: TimeInterval?
    let metadata: [String: String]
    let category: MetricCategory

    var isCompleted: Bool { endTime != nil }

    init(
        id: UUID = UUID(),
        name: String,
        startTime: Date = Date(),
        endTime: Date? = nil,
        duration: TimeInterval? = nil,
        metadata: [String: String] = [:],
        category: MetricCategory
    ) {
        self.id = id
        self.name = name
        self.startTime = startTime
        self.endTime = endTime
        self.duration = duration
        self.metadata = metadata
        self.category = category
    }

    mutating func complete(at endTime: Date = Date()) {
        self.endTime = endTime
        self.duration = endTime.timeIntervalSince(self.startTime)
    }
}

enum MetricCategory: String, Codable, CaseIterable, Sendable {
    case appLaunch
    case api
    case memory
    case custom
}

struct SlowOperationAlert: Identifiable, Sendable {
    let id: UUID
    let metric: PerformanceMetric
    let threshold: TimeInterval
    let timestamp: Date

    init(metric: PerformanceMetric, threshold: TimeInterval) {
        self.id = UUID()
        self.metric = metric
        self.threshold = threshold
        self.timestamp = Date()
    }
}

actor PerformanceMonitor {
    static let shared = PerformanceMonitor()

    private var metrics: [UUID: PerformanceMetric] = [:]
    private var completedMetrics: [PerformanceMetric] = []
    private var alerts: [SlowOperationAlert] = []
    private var thresholds: [MetricCategory: TimeInterval]
    private let logger: Logger
    private let maxStoredMetrics: Int
    private var memorySnapshot: MemorySnapshot?

    private init() {
        self.logger = Logger(subsystem: "com.oasisbio.performance", category: "monitor")
        self.thresholds = [
            .appLaunch: 2.0,
            .api: 1.0,
            .memory: 0.5,
            .custom: 1.0
        ]
        self.maxStoredMetrics = 1000
        logger.info("PerformanceMonitor initialized")
    }

    func updateMemorySnapshot(_ snapshot: MemorySnapshot) {
        self.memorySnapshot = snapshot
    }

    func getAvailableMemory() -> UInt64 {
        return os_proc_available_memory()
    }

    func checkMemoryPressure() -> MemoryPressureLevel {
        let available = getAvailableMemory()
        let lowThreshold: UInt64 = 100 * 1024 * 1024
        let criticalThreshold: UInt64 = 50 * 1024 * 1024

        if available < criticalThreshold {
            return .critical
        } else if available < lowThreshold {
            return .warning
        }
        return .normal
    }

    func recordMemoryMetric(name: String, availableMemory: UInt64, usedMemory: UInt64) {
        let metric = PerformanceMetric(
            name: name,
            category: .memory,
            metadata: [
                "availableMB": "\(availableMemory / 1024 / 1024)",
                "usedMB": "\(usedMemory / 1024 / 1024)"
            ]
        )
        completedMetrics.append(metric)

        if completedMetrics.count > maxStoredMetrics {
            completedMetrics.removeFirst(completedMetrics.count - maxStoredMetrics)
        }
    }

    func getMemoryMetrics(limit: Int = 50) -> [PerformanceMetric] {
        return completedMetrics
            .filter { $0.category == .memory }
            .suffix(limit)
            .map { $0 }
    }

    func getMemoryReport() -> String {
        var lines: [String] = ["=== Memory Report ==="]

        if let snapshot = memorySnapshot {
            lines.append("Available: \(snapshot.availableMB) MB")
            lines.append("Used: \(snapshot.usedMB) MB")
            lines.append("Usage: \(String(format: "%.1f", snapshot.usagePercent))%")
        }

        let pressureLevel = checkMemoryPressure()
        lines.append("Pressure Level: \(pressureLevel.description)")

        let memoryMetrics = getMemoryMetrics(limit: 10)
        if !memoryMetrics.isEmpty {
            lines.append("")
            lines.append("Recent Memory Metrics:")
            for metric in memoryMetrics {
                lines.append("  - \(metric.name): \(metric.metadata)")
            }
        }

        return lines.joined(separator: "\n")
    }

    func startTracking(name: String, category: MetricCategory, metadata: [String: String] = [:]) -> UUID {
        let metric = PerformanceMetric(
            name: name,
            category: category,
            metadata: metadata
        )
        metrics[metric.id] = metric
        logger.debug("Started tracking: \(name) (\(metric.id.uuidString.prefix(8)))")
        return metric.id
    }

    func stopTracking(id: UUID) async -> PerformanceMetric? {
        guard var metric = metrics.removeValue(forKey: id) else {
            logger.warning("Metric not found: \(id.uuidString.prefix(8))")
            return nil
        }

        metric.complete()

        if let duration = metric.duration, duration > thresholds[metric.category, default: 1.0] {
            let alert = SlowOperationAlert(metric: metric, threshold: thresholds[metric.category] ?? 1.0)
            alerts.append(alert)
            logger.warning("Slow operation detected: \(metric.name) took \(duration)s (threshold: \(self.thresholds[metric.category] ?? 1.0)s)")
        }

        completedMetrics.append(metric)
        if completedMetrics.count > maxStoredMetrics {
            completedMetrics.removeFirst(completedMetrics.count - maxStoredMetrics)
        }

        logger.debug("Stopped tracking: \(metric.name) (\(id.uuidString.prefix(8))) - Duration: \(metric.duration ?? 0)s")
        return metric
    }

    func measure<T: Sendable>(
        name: String,
        category: MetricCategory,
        metadata: [String: String] = [:],
        operation: @Sendable @escaping () async throws -> T
    ) async throws -> T {
        let metricId = startTracking(name: name, category: category, metadata: metadata)
        let startTime = CFAbsoluteTimeGetCurrent()

        do {
            let result = try await operation()
            _ = await stopTracking(id: metricId)
            return result
        } catch {
            let duration = CFAbsoluteTimeGetCurrent() - startTime
            if let metric = metrics.removeValue(forKey: metricId) {
                var failedMetric = metric
                failedMetric.complete(at: metric.startTime.addingTimeInterval(duration))
                completedMetrics.append(failedMetric)
            }
            logger.error("Operation failed: \(name) - \(error.localizedDescription)")
            throw error
        }
    }

    func measureSync<T: Sendable>(
        name: String,
        category: MetricCategory,
        metadata: [String: String] = [:],
        operation: @Sendable @escaping () throws -> T
    ) rethrows -> T {
        let metricId = startTracking(name: name, category: category, metadata: metadata)
        let startTime = CFAbsoluteTimeGetCurrent()

        do {
            let result = try operation()
            Task {
                _ = await stopTracking(id: metricId)
            }
            return result
        } catch {
            let duration = CFAbsoluteTimeGetCurrent() - startTime
            if let metric = metrics.removeValue(forKey: metricId) {
                var failedMetric = metric
                failedMetric.complete(at: metric.startTime.addingTimeInterval(duration))
                completedMetrics.append(failedMetric)
            }
            throw error
        }
    }

    func setThreshold(for category: MetricCategory, threshold: TimeInterval) {
        thresholds[category] = threshold
        logger.info("Threshold updated for \(category.rawValue): \(threshold)s")
    }

    func getThreshold(for category: MetricCategory) -> TimeInterval {
        thresholds[category, default: 1.0]
    }

    func getAlerts() -> [SlowOperationAlert] {
        alerts
    }

    func clearAlerts() {
        alerts.removeAll()
    }

    func getMetrics(category: MetricCategory? = nil) -> [PerformanceMetric] {
        if let category = category {
            return completedMetrics.filter { $0.category == category }
        }
        return completedMetrics
    }

    func getMemoryUsage() -> (used: UInt64, free: UInt64)? {
        var taskInfo = task_vm_info_data_t()
        var count = mach_msg_type_number_t(MemoryLayout<task_vm_info>.size) / 4
        let result = withUnsafeMutablePointer(to: &taskInfo) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count)
            }
        }

        guard result == KERN_SUCCESS else { return nil }

        let usedMemory = UInt64(taskInfo.phys_footprint)
        let freeMemory = UInt64(ProcessInfo.processInfo.physicalMemory) - usedMemory
        return (usedMemory, freeMemory)
    }

    func generateReport() -> PerformanceReport {
        let now = Date()
        let recentMetrics = completedMetrics.filter { metric in
            guard let duration = metric.duration else { return false }
            return now.timeIntervalSince(metric.startTime) < 3600
        }

        var categoryStats: [MetricCategory: CategoryStats] = [:]
        for category in MetricCategory.allCases {
            let categoryMetrics = recentMetrics.filter { $0.category == category }
            let durations = categoryMetrics.compactMap { $0.duration }

            guard !durations.isEmpty else { continue }

            let avg = durations.reduce(0, +) / Double(durations.count)
            let max = durations.max() ?? 0
            let min = durations.min() ?? 0
            let count = durations.count

            categoryStats[category] = CategoryStats(
                average: avg,
                max: max,
                min: min,
                count: count
            )
        }

        return PerformanceReport(
            generatedAt: now,
            totalMetrics: recentMetrics.count,
            categoryStats: categoryStats,
            recentAlerts: Array(alerts.suffix(10)),
            memoryUsage: getMemoryUsage()
        )
    }

    func reset() {
        metrics.removeAll()
        completedMetrics.removeAll()
        alerts.removeAll()
        logger.info("PerformanceMonitor reset")
    }
}

struct CategoryStats: Sendable {
    let average: TimeInterval
    let max: TimeInterval
    let min: TimeInterval
    let count: Int
}

struct PerformanceReport: Sendable {
    let generatedAt: Date
    let totalMetrics: Int
    let categoryStats: [MetricCategory: CategoryStats]
    let recentAlerts: [SlowOperationAlert]
    let memoryUsage: (used: UInt64, free: UInt64)?

    var summary: String {
        var lines: [String] = [
            "=== Performance Report ===",
            "Generated: \(ISO8601DateFormatter().string(from: generatedAt))",
            "Total Metrics: \(totalMetrics)",
            ""
        ]

        for (category, stats) in categoryStats.sorted(by: { $0.key.rawValue < $1.key.rawValue }) {
            lines.append("[\(category.rawValue)]")
            lines.append("  Count: \(stats.count)")
            lines.append("  Avg: \(String(format: "%.3f", stats.average))s")
            lines.append("  Max: \(String(format: "%.3f", stats.max))s")
            lines.append("  Min: \(String(format: "%.3f", stats.min))s")
            lines.append("")
        }

        if !recentAlerts.isEmpty {
            lines.append("Recent Alerts: \(recentAlerts.count)")
            for alert in recentAlerts.prefix(5) {
                lines.append("  - \(alert.metric.name): \(String(format: "%.3f", alert.metric.duration ?? 0))s")
            }
        }

        if let memory = memoryUsage {
            let usedMB = Double(memory.used) / 1024 / 1024
            let totalMB = Double(memory.used + memory.free) / 1024 / 1024
            lines.append("")
            lines.append("Memory Usage: \(String(format: "%.2f", usedMB))MB / \(String(format: "%.2f", totalMB))MB")
        }

        return lines.joined(separator: "\n")
    }
}

struct MemorySnapshot: Sendable {
    let availableMB: Double
    let usedMB: Double
    let usagePercent: Double
    let timestamp: Date

    init(available: UInt64, used: UInt64) {
        self.availableMB = Double(available) / 1024 / 1024
        self.usedMB = Double(used) / 1024 / 1024
        self.usagePercent = Double(used) / Double(available + used) * 100
        self.timestamp = Date()
    }
}

enum MemoryPressureLevel: Sendable {
    case normal
    case warning
    case critical

    var description: String {
        switch self {
        case .normal: return "Normal"
        case .warning: return "Warning"
        case .critical: return "Critical"
        }
    }
}
