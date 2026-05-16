import SwiftUI
import Combine

struct ViewPerformanceMonitor: ViewModifier {
    let name: String
    @State private var renderTime: TimeInterval = 0
    @State private var recompositions: Int = 0

    private var startTime: Date = Date()

    func body(content: Content) -> some View {
        content
            .onAppear {
                renderTime = Date().timeIntervalSince(startTime)
                recompositions += 1

                Task {
                    await trackRenderTime()
                }
            }
            .onChange(of: UUID()) { _, _ in
                recompositions += 1
            }
            .overlay(alignment: .topTrailing) {
                if recompositions > 1 {
                    Text("\(name): \(recompositions)x")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .padding(2)
                        .background(Color.red.opacity(0.8))
                        .foregroundColor(.white)
                        .cornerRadius(4)
                }
            }
    }

    private func trackRenderTime() async {
        await PerformanceMonitor.shared.measure(
            name: "ViewRender:\(name)",
            category: .custom,
            metadata: ["viewName": name, "recompositions": "\(recompositions)"],
            operation: {
                try await Task.sleep(nanoseconds: 0)
            }
        )
    }
}

struct ScrollPerformanceTracker: ViewModifier {
    @State private var scrollMetrics: ScrollMetrics = ScrollMetrics()
    @State private var fps: Double = 60.0
    @State private var lastUpdateTime: Date = Date()
    @State private var frameCount: Int = 0

    struct ScrollMetrics {
        var offset: CGFloat = 0
        var velocity: CGFloat = 0
        var isScrolling: Bool = false
    }

    func body(content: Content) -> some View {
        content
            .background(
                GeometryReader { geometry in
                    Color.clear
                        .preference(
                            key: ScrollOffsetPreferenceKey.self,
                            value: geometry.frame(in: .named("scroll")).origin.y
                        )
                }
            )
            .onPreferenceChange(ScrollOffsetPreferenceKey.self) { offset in
                let now = Date()
                let elapsed = now.timeIntervalSince(lastUpdateTime)

                if elapsed > 0 {
                    let currentFPS = Double(frameCount + 1) / elapsed
                    if currentFPS > 0 && currentFPS <= 120 {
                        fps = currentFPS
                    }
                    frameCount = 0
                    lastUpdateTime = now
                }

                Task {
                    await PerformanceMonitor.shared.measure(
                        name: "ScrollPerformance",
                        category: .custom,
                        metadata: [
                            "offset": "\(offset)",
                            "fps": String(format: "%.1f", fps)
                        ],
                        operation: {
                            try await Task.sleep(nanoseconds: 0)
                        }
                    )
                }
            }
    }
}

private struct ScrollOffsetPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

struct MemoryWarningObserver: ViewModifier {
    let onMemoryWarning: () -> Void

    func body(content: Content) -> some View {
        content
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.didReceiveMemoryWarningNotification)) { _ in
                onMemoryWarning()
            }
    }
}

struct ImageLoadPerformanceTracker: ViewModifier {
    let url: URL?

    func body(content: Content) -> some View {
        content
            .task(id: url) {
                guard url != nil else { return }

                await PerformanceMonitor.shared.measure(
                    name: "ImageLoad",
                    category: .custom,
                    metadata: ["url": url?.absoluteString ?? "unknown"],
                    operation: {
                        try await Task.sleep(nanoseconds: 100_000_000)
                    }
                )
            }
    }
}

struct AnimationPerformanceMonitor: ViewModifier {
    let animationName: String
    @State private var animationStartTime: Date?
    @State private var isAnimating: Bool = false

    func body(content: Content) -> some View {
        content
            .onChange(of: isAnimating) { _, newValue in
                if newValue {
                    animationStartTime = Date()
                    Task {
                        await PerformanceMonitor.shared.measure(
                            name: "Animation:\(animationName)",
                            category: .custom,
                            metadata: ["animation": animationName],
                            operation: {
                                try await Task.sleep(nanoseconds: 0)
                            }
                        )
                    }
                }
            }
    }
}

extension View {
    func monitorPerformance(name: String) -> some View {
        modifier(ViewPerformanceMonitor(name: name))
    }

    func trackScrollPerformance() -> some View {
        modifier(ScrollPerformanceTracker())
    }

    func onMemoryWarning(_ action: @escaping () -> Void) -> some View {
        modifier(MemoryWarningObserver(onMemoryWarning: action))
    }

    func trackImageLoadPerformance(url: URL?) -> some View {
        modifier(ImageLoadPerformanceTracker(url: url))
    }
}

@MainActor
final class RenderPerformanceCollector: ObservableObject {
    static let shared = RenderPerformanceCollector()

    @Published var viewMetrics: [String: ViewMetric] = [:]

    struct ViewMetric: Identifiable {
        let id = UUID()
        let viewName: String
        var recompositionCount: Int = 0
        var averageRenderTime: TimeInterval = 0
        var lastRenderTime: Date = Date()

        mutating func recordRender(time: TimeInterval) {
            recompositionCount += 1
            let delta = time - averageRenderTime
            averageRenderTime += delta / Double(recompositionCount)
            lastRenderTime = Date()
        }
    }

    private init() {}

    func recordRender(viewName: String, time: TimeInterval) {
        if var metric = viewMetrics[viewName] {
            metric.recordRender(time: time)
            viewMetrics[viewName] = metric
        } else {
            var newMetric = ViewMetric(viewName: viewName)
            newMetric.recordRender(time: time)
            viewMetrics[viewName] = newMetric
        }
    }

    func generatePerformanceSnapshot() -> PerformanceSnapshot {
        let views = viewMetrics.values.map { metric in
            ViewPerformanceSnapshot(
                viewName: metric.viewName,
                recompositionCount: metric.recompositionCount,
                averageRenderTime: metric.averageRenderTime
            )
        }.sorted { $0.recompositionCount > $1.recompositionCount }

        return PerformanceSnapshot(
            timestamp: Date(),
            viewMetrics: views,
            totalViews: views.count,
            totalRecompositions: views.reduce(0) { $0 + $1.recompositionCount }
        )
    }
}

struct PerformanceSnapshot {
    let timestamp: Date
    let viewMetrics: [ViewPerformanceSnapshot]
    let totalViews: Int
    let totalRecompositions: Int
}

struct ViewPerformanceSnapshot: Identifiable {
    let id = UUID()
    let viewName: String
    let recompositionCount: Int
    let averageRenderTime: TimeInterval
}

struct PerformanceDashboard: View {
    @StateObject private var collector = RenderPerformanceCollector.shared
    @State private var snapshot: PerformanceSnapshot?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Performance Dashboard")
                    .font(.headline)

                Spacer()

                Button("Refresh") {
                    snapshot = collector.generatePerformanceSnapshot()
                }
                .buttonStyle(.bordered)
            }

            if let snapshot = snapshot {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Total Views:")
                        Text("\(snapshot.totalViews)")
                            .fontWeight(.bold)
                    }

                    HStack {
                        Text("Total Recompositions:")
                        Text("\(snapshot.totalRecompositions)")
                            .fontWeight(.bold)
                            .foregroundColor(snapshot.totalRecompositions > 100 ? .red : .primary)
                    }
                }
                .font(.subheadline)

                Divider()

                Text("View Metrics")
                    .font(.subheadline)
                    .fontWeight(.medium)

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 4) {
                        ForEach(snapshot.viewMetrics.prefix(20)) { metric in
                            HStack {
                                Text(metric.viewName)
                                    .font(.caption)
                                    .lineLimit(1)

                                Spacer()

                                Text("\(metric.recompositionCount)x")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(metric.recompositionCount > 10 ? .red : .secondary)

                                Text(String(format: "%.2fms", metric.averageRenderTime * 1000))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }
                .frame(maxHeight: 300)
            } else {
                Text("Click Refresh to generate snapshot")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .onAppear {
            snapshot = collector.generatePerformanceSnapshot()
        }
    }
}
