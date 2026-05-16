import SwiftUI
import Combine

#if canImport(Observable)
@Observable
class ObservableViewModel<T: Sendable> {
    var value: T
    var isLoading: Bool = false
    var error: Error?

    init(value: T) {
        self.value = value
    }

    func update(_ newValue: T) {
        self.value = newValue
    }
}
#endif

protocol IdentifiableValue: Identifiable, Equatable {
    associatedtype ID: Hashable = Self.ID
    var id: ID { get }
}

@propertyWrapper
struct Stable<Value>: DynamicProperty where Value: Equatable {
    @private @State private var storedValue: Value

    var wrappedValue: Value {
        get { storedValue }
        nonmutating set {
            if newValue != storedValue {
                storedValue = newValue
            }
        }
    }

    var projectedValue: Binding<Value> {
        Binding(
            get: { storedValue },
            set: { newValue in
                if newValue != storedValue {
                    storedValue = newValue
                }
            }
        )
    }

    init(wrappedValue: Value) {
        self._storedValue = State(initialValue: wrappedValue)
    }

    init(initialValue: Value) {
        self._storedValue = State(initialValue: initialValue)
    }
}

struct ViewRecompositionMetrics {
    var recompositionCount: Int = 0
    var lastRecompositionTime: Date?
    var averageInterval: TimeInterval = 0

    private var intervals: [TimeInterval] = []

    mutating func recordRecomposition() {
        recompositionCount += 1
        let now = Date()

        if let lastTime = lastRecompositionTime {
            let interval = now.timeIntervalSince(lastTime)
            intervals.append(interval)
            if intervals.count > 10 {
                intervals.removeFirst()
            }
            averageInterval = intervals.reduce(0, +) / Double(intervals.count)
        }

        lastRecompositionTime = now
    }

    mutating func reset() {
        recompositionCount = 0
        lastRecompositionTime = nil
        averageInterval = 0
        intervals.removeAll()
    }
}

struct RecompositionDebugModifier: ViewModifier {
    @State private var metrics = ViewRecompositionMetrics()
    let viewName: String
    let enabled: Bool

    func body(content: Content) -> some View {
        content
            .id(metrics.recompositionCount)
            .onAppear {
                if enabled {
                    metrics.recordRecomposition()
                }
            }
            .overlay(alignment: .topLeading) {
                if enabled {
                    Text("\(viewName): \(metrics.recompositionCount)")
                        .font(.caption2)
                        .padding(4)
                        .background(Color.black.opacity(0.7))
                        .foregroundColor(.white)
                        .cornerRadius(4)
                }
            }
    }
}

extension View {
    func trackRecomposition(viewName: String, enabled: Bool = false) -> some View {
        modifier(RecompositionDebugModifier(viewName: viewName, enabled: enabled))
    }
}

struct OptimizedBinding<T: Equatable>: DynamicProperty {
    private let getValue: () -> T
    private let setValue: (T) -> Void

    var wrappedValue: T {
        get { getValue() }
        nonmutating set { setValue(newValue) }
    }

    var projectedValue: Binding<T> {
        Binding(
            get: getValue,
            set: { newValue in
                if newValue != getValue() {
                    setValue(newValue)
                }
            }
        )
    }

    init(_ binding: Binding<T>) {
        self.getValue = { binding.wrappedValue }
        self.setValue = { binding.wrappedValue = $0 }
    }
}

struct SelectiveUpdate<Content: View>: View {
    let content: () -> Content
    @State private var isExpanded = false

    var body: some View {
        content()
            .id(isExpanded)
    }
}

struct MemoizedView<Content: View>: View {
    let content: () -> Content
    @State private var cachedContent: Content?

    var body: some View {
        Group {
            if let cached = cachedContent {
                cached
            } else {
                content()
                    .onAppear {
                        cachedContent = content()
                    }
            }
        }
    }
}

struct AvoidUnnecessaryRedraw: ViewModifier {
    let id: AnyHashable

    func body(content: Content) -> some View {
        content
            .id(id)
    }
}

extension View {
    func avoidRedraw(id: AnyHashable) -> some View {
        modifier(AvoidUnnecessaryRedraw(id: id))
    }
}

struct LifecycleMonitor: ViewModifier {
    @State private var onAppearCalled = false

    let onFirstAppear: () -> Void
    let onDisappear: () -> Void

    func body(content: Content) -> some View {
        content
            .onAppear {
                if !onAppearCalled {
                    onAppearCalled = true
                    onFirstAppear()
                }
            }
            .onDisappear {
                onDisappear()
            }
    }
}

extension View {
    func onFirstAppear(_ action: @escaping () -> Void) -> some View {
        modifier(LifecycleMonitor(
            onFirstAppear: action,
            onDisappear: {}
        ))
    }

    func onFirstAppearAndDisappear(
        onAppear: @escaping () -> Void,
        onDisappear: @escaping () -> Void
    ) -> some View {
        modifier(LifecycleMonitor(
            onFirstAppear: onAppear,
            onDisappear: onDisappear
        ))
    }
}

@resultBuilder
struct ViewBuilderOptimized {
    static func buildBlock<Content: View>(_ content: Content) -> some View {
        content
    }

    static func buildEither<TrueContent: View, FalseContent: View>(
        _ content: Bool
    ) -> _ConditionalContent<TrueContent, FalseContent> {
        if content {
            return .init(trueContent: TrueContent())
        } else {
            return .init(falseContent: FalseContent())
        }
    }
}

struct ConditionalContent<TrueContent, FalseContent>: View where TrueContent: View, FalseContent: View {
    let trueContent: () -> TrueContent
    let falseContent: () -> FalseContent

    var body: some View {
        falseContent()
    }
}

struct _ConditionalContent<TrueContent, FalseContent>: View where TrueContent: View, FalseContent: View {
    let storage: Storage

    enum Storage {
        case trueContent(TrueContent)
        case falseContent(FalseContent)
    }

    init(trueContent: TrueContent) {
        storage = .trueContent(trueContent)
    }

    init(falseContent: FalseContent) {
        storage = .falseContent(falseContent)
    }

    var body: some View {
        switch storage {
        case .trueContent(let content):
            content
        case .falseContent(let content):
            content
        }
    }
}

struct ReduceLayoutRebuilds: ViewModifier {
    let identity: AnyHashable

    func body(content: Content) -> some View {
        content
            .layoutPriority(identity.hashValue > 0 ? 1 : 0)
    }
}

extension View {
    func reduceLayoutRebuilds(identity: AnyHashable) -> some View {
        modifier(ReduceLayoutRebuilds(identity: identity))
    }
}

struct SharedElement<Identifiable, Content: View>: View {
    let id: Identifiable
    let content: () -> Content

    @Namespace private var namespace

    var body: some View {
        content()
            .matchedGeometryEffect(id: id, in: namespace)
    }
}

struct PerformanceOptimizedContainer<Content: View>: View {
    let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        content()
            .drawingGroup()
    }
}
