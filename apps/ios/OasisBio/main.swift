import UIKit

let startupMonitor = StartupPerformanceMonitor.shared

autoreleasepool {
    UIApplicationMain(
        CommandLine.argc,
        CommandLine.unsafeArgv,
        NSStringFromClass(UIApplication.self),
        AppDelegate.self
    )
}
