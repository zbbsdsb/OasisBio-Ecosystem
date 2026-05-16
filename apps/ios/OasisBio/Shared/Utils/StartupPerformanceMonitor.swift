import Foundation
import os.log

enum StartupPhase: String, CaseIterable {
    case appLaunch = "app_launch"
    case appInit = "app_init"
    case viewAppear = "view_appear"
    case asyncInit = "async_init"
    case ready = "ready"
    case foreground = "foreground"
    case background = "background"
    case inactive = "inactive"
}

final class StartupPerformanceMonitor: @unchecked Sendable {
    static let shared = StartupPerformanceMonitor()

    private let logger: Logger
    private let startTime: CFAbsoluteTime
    private var phaseTimestamps: [StartupPhase: CFAbsoluteTime] = [:]
    private let lock = NSLock()

    private init() {
        self.logger = Logger(subsystem: "com.oasisbio.performance", category: "startup")
        self.startTime = CFAbsoluteTimeGetCurrent()
        logger.info("Startup monitoring initialized")
    }

    func recordPhase(_ phase: StartupPhase) {
        lock.lock()
        defer { lock.unlock() }

        let currentTime = CFAbsoluteTimeGetCurrent()
        phaseTimestamps[phase] = currentTime

        let elapsed = (currentTime - startTime) * 1000
        logger.info("[\(phase.rawValue)] elapsed: \(elapsed, format: .fixed(precision: 2))ms")

        if phase == .ready {
            logStartupSummary()
        }
    }

    func recordPhaseAsync(_ phase: StartupPhase) async {
        recordPhase(phase)
    }

    func getPhaseDuration(_ phase: StartupPhase) -> TimeInterval? {
        lock.lock()
        defer { lock.unlock() }

        guard let phaseTime = phaseTimestamps[phase] else { return nil }
        return phaseTime - startTime
    }

    func getPhaseDurations() -> [StartupPhase: TimeInterval] {
        lock.lock()
        defer { lock.unlock() }

        var durations: [StartupPhase: TimeInterval] = [:]
        let sortedPhases = StartupPhase.allCases

        for (index, phase) in sortedPhases.enumerated() {
            guard let phaseTime = phaseTimestamps[phase] else { continue }

            let duration: TimeInterval
            if index + 1 < sortedPhases.count,
               let nextPhase = sortedPhases[safe: index + 1],
               let nextTime = phaseTimestamps[nextPhase] {
                duration = nextTime - phaseTime
            } else {
                duration = phaseTime - startTime
            }

            durations[phase] = duration
        }

        return durations
    }

    func getTotalStartupTime() -> TimeInterval? {
        lock.lock()
        defer { lock.unlock() }

        guard let readyTime = phaseTimestamps[.ready] else { return nil }
        return readyTime - startTime
    }

    private func logStartupSummary() {
        let durations = getPhaseDurations()
        guard !durations.isEmpty else { return }

        logger.info("=== Startup Summary ===")
        for (phase, duration) in durations.sorted(by: { $0.value < $1.value }) {
            let ms = duration * 1000
            logger.info("  \(phase.rawValue): \(ms, format: .fixed(precision: 2))ms")
        }

        if let total = getTotalStartupTime() {
            let totalMs = total * 1000
            logger.info("  Total: \(totalMs, format: .fixed(precision: 2))ms")

            if total > 2.0 {
                logger.warning("Startup time exceeds 2s threshold")
            }
        }
    }

    func reset() {
        lock.lock()
        defer { lock.unlock() }

        phaseTimestamps.removeAll()
        logger.info("Startup monitor reset")
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}
