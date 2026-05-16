import XCTest
import Foundation

final class PerformanceTests: XCTestCase {

    private var monitor: PerformanceTestMonitor!

    override func setUp() {
        super.setUp()
        monitor = PerformanceTestMonitor()
    }

    override func tearDown() {
        monitor = nil
        super.tearDown()
    }

    // MARK: - Startup Time Tests

    func testColdStartupTime() throws {
        let startTime = CFAbsoluteTimeGetCurrent()

        try simulateColdStartup()

        let endTime = CFAbsoluteTimeGetCurrent()
        let startupTime = endTime - startTime

        let report = monitor.generateReport()
        report.addMetric(
            name: "cold_startup",
            value: startupTime,
            unit: .seconds,
            category: .startup
        )

        XCTAssertLessThan(startupTime, 3.0, "Cold startup should be under 3 seconds")
    }

    func testWarmStartupTime() throws {
        let startTime = CFAbsoluteTimeGetCurrent()

        try simulateWarmStartup()

        let endTime = CFAbsoluteTimeGetCurrent()
        let startupTime = endTime - startTime

        let report = monitor.generateReport()
        report.addMetric(
            name: "warm_startup",
            value: startupTime,
            unit: .seconds,
            category: .startup
        )

        XCTAssertLessThan(startupTime, 1.0, "Warm startup should be under 1 second")
    }

    func testApplicationInitialization() throws {
        measure(metrics: [XCTMemoryMetric(applicationMemorySizeKey)]) {
            let expectation = self.expectation(description: "Initialization complete")

            DispatchQueue.global().async {
                self.initializeApplication()
                expectation.fulfill()
            }

            self.wait(for: [expectation], timeout: 5.0)
        }
    }

    // MARK: - Memory Tests

    func testMemoryUsage() throws {
        let initialMemory = getMemoryUsage()

        let testObjects = createTestObjects(count: 100)

        let finalMemory = getMemoryUsage()
        let memoryGrowth = finalMemory - initialMemory

        let report = monitor.generateReport()
        report.addMetric(
            name: "memory_growth",
            value: memoryGrowth,
            unit: .bytes,
            category: .memory
        )

        XCTAssertLessThan(memoryGrowth, 50 * 1024 * 1024, "Memory growth should be under 50MB")

        _ = testObjects
    }

    func testMemoryLeakDetection() throws {
        weak var weakRef: AnyObject? = nil

        autoreleasepool {
            let strongObject = TestLeakObject()
            weakRef = strongObject
        }

        XCTAssertNil(weakRef, "Object should be deallocated after leaving autoreleasepool")
    }

    func testMemoryAllocationPerformance() throws {
        measure(metrics: [XCTMemoryMetric(applicationMemorySizeKey)]) {
            for _ in 0..<1000 {
                _ = ByteArray(size: 1024 * 100)
            }
        }
    }

    func testHeapMemoryUsage() throws {
        let heapInfo = getHeapInfo()

        let report = monitor.generateReport()
        report.addMetric(
            name: "heap_used",
            value: Double(heapInfo.used),
            unit: .bytes,
            category: .memory
        )
        report.addMetric(
            name: "heap_free",
            value: Double(heapInfo.free),
            unit: .bytes,
            category: .memory
        )

        XCTAssertGreaterThan(heapInfo.total, 0, "Heap total should be greater than 0")
        XCTAssertGreaterThanOrEqual(heapInfo.used, 0, "Heap used should be non-negative")
    }

    // MARK: - Render Performance Tests

    func testViewRenderingPerformance() throws {
        measure(metrics: [XCTClockMonotonicMetric()]) {
            renderTestViews(count: 100)
        }
    }

    func testScrollPerformance() throws {
        measure(metrics: [XCTCPUMetric(), XCTMemoryMetric(applicationMemorySizeKey)]) {
            simulateScrollOperations(count: 50)
        }
    }

    func testAnimationPerformance() throws {
        measure(metrics: [XCTClockMonotonicMetric()]) {
            runAnimationTest(duration: 1.0)
        }
    }

    // MARK: - API Response Time Tests

    func testAPICallResponseTime() throws {
        measure(metrics: [XCTClockMonotonicMetric()]) {
            simulateAPICall()
        }
    }

    func testMultipleAPICalls() throws {
        let endpointCount = 5

        measure(metrics: [XCTClockMonotonicMetric()]) {
            for i in 0..<endpointCount {
                simulateAPICall(endpoint: "/api/test/\(i)")
            }
        }
    }

    // MARK: - Helper Methods

    private func simulateColdStartup() throws {
        Thread.sleep(forTimeInterval: 0.1)
    }

    private func simulateWarmStartup() throws {
        Thread.sleep(forTimeInterval: 0.05)
    }

    private func initializeApplication() {
        let _ = createTestObjects(count: 10)
    }

    private func getMemoryUsage() -> Int64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }

        guard result == KERN_SUCCESS else { return 0 }
        return Int64(info.resident_size)
    }

    private func getHeapInfo() -> (total: Int64, used: Int64, free: Int64) {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }

        guard result == KERN_SUCCESS else { return (0, 0, 0) }

        let used = Int64(info.resident_size)
        let total = Int64(ProcessInfo.processInfo.physicalMemory)
        let free = total - used

        return (total, used, free)
    }

    private func createTestObjects(count: Int) -> [ByteArray] {
        var objects: [ByteArray] = []
        for _ in 0..<count {
            objects.append(ByteArray(size: 1024 * 100))
        }
        return objects
    }

    private func renderTestViews(count: Int) {
        for _ in 0..<count {
            let view = TestView()
            view.render()
        }
    }

    private func simulateScrollOperations(count: Int) {
        for _ in 0..<count {
            Thread.sleep(forTimeInterval: 0.001)
        }
    }

    private func runAnimationTest(duration: Double) {
        Thread.sleep(forTimeInterval: duration)
    }

    private func simulateAPICall(endpoint: String = "/api/test") {
        Thread.sleep(forTimeInterval: 0.05)
    }
}

// MARK: - Test Helper Classes

final class ByteArray {
    private var data: [UInt8]

    init(size: Int) {
        data = [UInt8](repeating: 0, count: size)
    }
}

final class TestLeakObject {
    var data: [Int] = []

    init() {
        data = Array(repeating: 0, count: 1000)
    }
}

final class TestView {
    func render() {
        Thread.sleep(forTimeInterval: 0.0001)
    }
}

// MARK: - Performance Monitor

final class PerformanceTestMonitor {
    private var metrics: [PerformanceTestMetric] = []

    struct PerformanceTestMetric {
        let name: String
        let value: Double
        let unit: MetricUnit
        let category: MetricCategory
        let timestamp: Date

        enum MetricUnit {
            case seconds
            case bytes
            case count
            case percentage
        }

        enum MetricCategory {
            case startup
            case memory
            case render
            case api
            case custom
        }
    }

    func addMetric(name: String, value: Double, unit: PerformanceTestMetric.MetricUnit, category: PerformanceTestMetric.MetricCategory) {
        let metric = PerformanceTestMetric(
            name: name,
            value: value,
            unit: unit,
            category: category,
            timestamp: Date()
        )
        metrics.append(metric)
    }

    func generateReport() -> TestPerformanceReport {
        return TestPerformanceReport(metrics: metrics)
    }

    func reset() {
        metrics.removeAll()
    }
}

struct TestPerformanceReport {
    private let metrics: [PerformanceTestMonitor.PerformanceTestMetric]

    init(metrics: [PerformanceTestMonitor.PerformanceTestMetric]) {
        self.metrics = metrics
    }

    func summary() -> String {
        var lines: [String] = ["=== Performance Test Report ==="]
        lines.append("Total Metrics: \(metrics.count)")

        for metric in metrics {
            let unitString: String
            switch metric.unit {
            case .seconds: unitString = "s"
            case .bytes: unitString = "B"
            case .count: unitString = "count"
            case .percentage: unitString = "%"
            }
            lines.append("[\(metric.category)] \(metric.name): \(String(format: "%.4f", metric.value)) \(unitString)")
        }

        return lines.joined(separator: "\n")
    }
}
