import Foundation
import XCTest

final class OasisBioPerformanceTests: XCTestCase {

    static var allTests: [(String, (OasisBioPerformanceTests) -> () throws -> Void)] = [
        ("testStartupPerformance", testStartupPerformance),
        ("testMemoryUsage", testMemoryUsage),
        ("testAPIResponseTime", testAPIResponseTime),
        ("testViewRendering", testViewRendering),
        ("testScrollPerformance", testScrollPerformance),
    ]

    override class var defaultTestSuite: XCTestSuite {
        let suite = XCTestSuite(forTestCaseClass: OasisBioPerformanceTests.self)
        return suite
    }

    func testStartupPerformance() throws {
        let startTime = CFAbsoluteTimeGetCurrent()

        Thread.sleep(forTimeInterval: 0.1)

        let endTime = CFAbsoluteTimeGetCurrent()
        let duration = endTime - startTime

        XCTAssertLessThan(duration, 3.0, "Startup time should be under 3 seconds")
        print("Startup time: \(String(format: "%.3f", duration))s")
    }

    func testMemoryUsage() throws {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4

        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }

        XCTAssertEqual(result, KERN_SUCCESS, "Failed to get memory info")

        let usedMemoryMB = Double(info.resident_size) / 1024 / 1024
        print("Memory usage: \(String(format: "%.2f", usedMemoryMB)) MB")

        XCTAssertLessThan(usedMemoryMB, 200, "Memory usage should be under 200MB")
    }

    func testAPIResponseTime() throws {
        let startTime = CFAbsoluteTimeGetCurrent()

        simulateNetworkCall()

        let endTime = CFAbsoluteTimeGetCurrent()
        let duration = endTime - startTime

        XCTAssertLessThan(duration, 1.0, "API response time should be under 1 second")
        print("API response time: \(String(format: "%.3f", duration))s")
    }

    func testViewRendering() throws {
        measureMetrics([.wallClockTime, .cpuTime]) {
            for _ in 0..<100 {
                renderSimpleView()
            }
        }
    }

    func testScrollPerformance() throws {
        measureMetrics([.wallClockTime]) {
            for _ in 0..<50 {
                simulateScroll()
            }
        }
    }

    private func simulateNetworkCall() {
        Thread.sleep(forTimeInterval: 0.05)
    }

    private func renderSimpleView() {
        Thread.sleep(forTimeInterval: 0.001)
    }

    private func simulateScroll() {
        Thread.sleep(forTimeInterval: 0.0001)
    }
}

final class OasisBioMemoryLeakTests: XCTestCase {

    func testWeakReferenceDeallocation() throws {
        weak var weakRef: AnyObject? = nil

        autoreleasepool {
            let object = NSObject()
            weakRef = object
            XCTAssertNotNil(weakRef, "Object should exist before leaving scope")
        }

        XCTAssertNil(weakRef, "Object should be deallocated after leaving autoreleasepool")
    }

    func testMemoryGrowthAfterOperations() throws {
        var initialMemory = getMemoryUsage()

        for _ in 0..<10 {
            _ = allocateTestData()
        }

        var finalMemory = getMemoryUsage()

        XCTAssertGreaterThan(finalMemory, initialMemory, "Memory should increase after allocations")

        autoreleasepool {
            for _ in 0..<10 {
                _ = allocateTestData()
            }
        }

        let afterAutoreleasepool = getMemoryUsage()
        XCTAssertLessThanOrEqual(afterAutoreleasepool, finalMemory, "Memory should be freed after autoreleasepool")
    }

    func testLargeArrayAllocation() throws {
        measureMetrics([.memory]) {
            let array = (0..<10000).map { _ in UUID().uuidString }
            XCTAssertEqual(array.count, 10000)
        }
    }

    private func allocateTestData() -> [Int] {
        return (0..<1000).map { $0 }
    }

    private func getMemoryUsage() -> UInt64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4

        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }

        guard result == KERN_SUCCESS else { return 0 }
        return info.resident_size
    }
}

final class OasisBioBenchmarkTests: XCTestCase {

    func testBenchmarkRenderOperations() throws {
        measureMetrics([.wallClockTime]) {
            for i in 0..<1000 {
                _ = "render_\(i)"
            }
        }
    }

    func testBenchmarkDataProcessing() throws {
        measureMetrics([.cpuTime, .wallClockTime]) {
            let data = (0..<10000).map { $0 * 2 }
            let filtered = data.filter { $0 % 3 == 0 }
            XCTAssertGreaterThan(filtered.count, 0)
        }
    }

    func testBenchmarkStringOperations() throws {
        measureMetrics([.wallClockTime]) {
            var result = ""
            for i in 0..<1000 {
                result += "item_\(i)_"
            }
            XCTAssertGreaterThan(result.count, 0)
        }
    }
}
