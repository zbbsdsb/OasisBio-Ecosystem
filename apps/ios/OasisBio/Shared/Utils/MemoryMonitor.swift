import Foundation
import os.log
import UIKit

@MainActor
final class MemoryMonitor: ObservableObject {
    static let shared = MemoryMonitor()

    @Published private(set) var availableMemory: UInt64 = 0
    @Published private(set) var usedMemory: UInt64 = 0
    @Published private(set) var memoryUsagePercent: Double = 0
    @Published private(set) var isUnderPressure: Bool = false
    @Published private(set) var memoryWarningLevel: MemoryWarningLevel = .normal

    private let logger: Logger
    private var monitorTimer: Timer?
    private let lowMemoryThreshold: UInt64 = 100 * 1024 * 1024
    private let criticalMemoryThreshold: UInt64 = 50 * 1024 * 1024
    private var warningHandlers: [() -> Void] = []

    enum MemoryWarningLevel {
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

    private init() {
        self.logger = Logger(subsystem: "com.oasisbio.memory", category: "monitor")
        updateMemoryStats()
        setupMemoryWarningObserver()
        startMonitoring()
    }

    private func setupMemoryWarningObserver() {
        NotificationCenter.default.addObserver(
            forName: UIApplication.didReceiveMemoryWarningNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.handleSystemMemoryWarning()
            }
        }
    }

    private func handleSystemMemoryWarning() {
        logger.warning("System memory warning received")
        memoryWarningLevel = .critical
        triggerWarningActions()
        performEmergencyCleanup()
    }

    func addWarningHandler(_ handler: @escaping () -> Void) {
        warningHandlers.append(handler)
    }

    private func triggerWarningActions() {
        for handler in warningHandlers {
            handler()
        }
    }

    private func performEmergencyCleanup() {
        CacheManager.shared.clearMemoryCache()
        logger.info("Emergency memory cleanup performed")
    }

    func startMonitoring(interval: TimeInterval = 5.0) {
        monitorTimer?.invalidate()
        monitorTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateMemoryStats()
            }
        }
        logger.info("Memory monitoring started with \(interval)s interval")
    }

    func stopMonitoring() {
        monitorTimer?.invalidate()
        monitorTimer = nil
        logger.info("Memory monitoring stopped")
    }

    private func updateMemoryStats() {
        let memoryInfo = getMemoryInfo()

        availableMemory = memoryInfo.available
        usedMemory = memoryInfo.used
        memoryUsagePercent = memoryInfo.usagePercent

        updateWarningLevel()

        Task {
            let snapshot = MemorySnapshot(available: memoryInfo.available, used: memoryInfo.used)
            await PerformanceMonitor.shared.updateMemorySnapshot(snapshot)
            await PerformanceMonitor.shared.recordMemoryMetric(
                name: "MemoryUpdate",
                availableMemory: memoryInfo.available,
                usedMemory: memoryInfo.used
            )
        }

        logger.debug("Memory: available=\(availableMemory / 1024 / 1024)MB, used=\(usedMemory / 1024 / 1024)MB, usage=\(String(format: "%.1f", memoryUsagePercent))%")
    }

    private func updateWarningLevel() {
        if availableMemory < criticalMemoryThreshold {
            memoryWarningLevel = .critical
            if !isUnderPressure {
                isUnderPressure = true
                triggerWarningActions()
            }
        } else if availableMemory < lowMemoryThreshold {
            memoryWarningLevel = .warning
        } else {
            memoryWarningLevel = .normal
            isUnderPressure = false
        }
    }

    func getMemoryInfo() -> (available: UInt64, used: UInt64, usagePercent: Double) {
        let available = getAvailableMemory()
        let totalMemory = ProcessInfo.processInfo.physicalMemory
        let used = totalMemory > available ? totalMemory - available : 0
        let usagePercent = Double(used) / Double(totalMemory) * 100

        return (available, used, usagePercent)
    }

    private func getAvailableMemory() -> UInt64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4

        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }

        guard result == KERN_SUCCESS else {
            return 0
        }

        let footPrint = info.resident_size
        let available = os_proc_available_memory()

        return available
    }

    func forceCleanup() {
        CacheManager.shared.clearMemoryCache()
        updateMemoryStats()
        logger.info("Forced memory cleanup completed")
    }

    func getStatusReport() -> MemoryStatusReport {
        let memoryInfo = getMemoryInfo()

        return MemoryStatusReport(
            timestamp: Date(),
            availableMemoryMB: Double(memoryInfo.available) / 1024 / 1024,
            usedMemoryMB: Double(memoryInfo.used) / 1024 / 1024,
            totalMemoryMB: Double(ProcessInfo.processInfo.physicalMemory) / 1024 / 1024,
            usagePercent: memoryInfo.usagePercent,
            warningLevel: memoryWarningLevel,
            isUnderPressure: isUnderPressure
        )
    }
}

struct MemoryStatusReport {
    let timestamp: Date
    let availableMemoryMB: Double
    let usedMemoryMB: Double
    let totalMemoryMB: Double
    let usagePercent: Double
    let warningLevel: MemoryMonitor.MemoryWarningLevel
    let isUnderPressure: Bool

    var summary: String {
        return """
        Memory Status Report
        ===================
        Timestamp: \(ISO8601DateFormatter().string(from: timestamp))
        Available: \(String(format: "%.2f", availableMemoryMB)) MB
        Used: \(String(format: "%.2f", usedMemoryMB)) MB
        Total: \(String(format: "%.2f", totalMemoryMB)) MB
        Usage: \(String(format: "%.1f", usagePercent))%
        Warning Level: \(warningLevel.description)
        Under Pressure: \(isUnderPressure)
        """
    }
}
