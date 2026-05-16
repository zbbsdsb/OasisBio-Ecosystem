import SwiftUI

@main
struct OasisBioApp: App {
    @StateObject private var dependencyContainer = DependencyContainer.shared
    @State private var isLoggedIn = false
    @State private var isInitialized = false

    @Environment(\.scenePhase) private var scenePhase

    init() {
        StartupPerformanceMonitor.shared.recordPhase(.appInit)
    }

    var body: some Scene {
        WindowGroup {
            ZStack {
                if isInitialized {
                    contentView
                        .transition(.opacity.animation(.easeInOut(duration: 0.3)))
                } else {
                    LaunchScreenView()
                        .transition(.opacity.animation(.easeInOut(duration: 0.2)))
                }
            }
            .onAppear {
                StartupPerformanceMonitor.shared.recordPhase(.viewAppear)
                initializeApp()
            }
        }
        .onChange(of: scenePhase) { _, newPhase in
            handleScenePhaseChange(newPhase)
        }
    }

    @ViewBuilder
    private var contentView: some View {
        if isLoggedIn {
            MainTabView(
                identityViewModel: dependencyContainer.makeIdentityViewModel(),
                chatViewModel: dependencyContainer.makeChatViewModel(),
                worldViewModel: dependencyContainer.makeWorldViewModel(),
                authViewModel: dependencyContainer.makeAuthViewModel()
            )
        } else {
            WelcomeView(viewModel: dependencyContainer.makeAuthViewModel()) {
                withAnimation(.easeInOut(duration: 0.3)) {
                    isLoggedIn = true
                }
            }
        }
    }

    private func initializeApp() {
        Task {
            await StartupPerformanceMonitor.shared.recordPhaseAsync(.asyncInit)

            await MainActor.run {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isInitialized = true
                }
                StartupPerformanceMonitor.shared.recordPhase(.ready)
            }
        }
    }

    private func handleScenePhaseChange(_ phase: ScenePhase) {
        switch phase {
        case .active:
            StartupPerformanceMonitor.shared.recordPhase(.foreground)
        case .background:
            StartupPerformanceMonitor.shared.recordPhase(.background)
        case .inactive:
            StartupPerformanceMonitor.shared.recordPhase(.inactive)
        @unknown default:
            break
        }
    }
}

struct MainTabView: View {
    let identityViewModel: IdentityViewModel
    let chatViewModel: ChatViewModel
    let worldViewModel: WorldViewModel
    let authViewModel: AuthViewModel

    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            LazyView(DashboardView(
                identityViewModel: identityViewModel,
                worldViewModel: worldViewModel
            ))
                .tabItem {
                    Image(systemName: "square.grid.2x2")
                    Text("仪表盘")
                }
                .tag(0)

            LazyView(IdentityListView(viewModel: identityViewModel))
                .tabItem {
                    Image(systemName: "person.circle")
                    Text("身份")
                }
                .tag(1)

            LazyView(ChatView(viewModel: chatViewModel))
                .tabItem {
                    Image(systemName: "message.circle")
                    Text("助手")
                }
                .tag(2)

            LazyView(WorldBuilderView(viewModel: worldViewModel))
                .tabItem {
                    Image(systemName: "globe")
                    Text("世界")
                }
                .tag(3)

            LazyView(SettingsView(authViewModel: authViewModel))
                .tabItem {
                    Image(systemName: "gearshape.circle")
                    Text("设置")
                }
                .tag(4)
        }
        .tabViewStyle(.automatic)
    }
}

struct LaunchScreenView: View {
    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                Image(systemName: "leaf.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.green)

                ProgressView()
                    .progressViewStyle(.circular)
                    .scaleEffect(1.2)
            }
        }
    }
}

struct LazyView<Content: View>: View {
    let build: () -> Content
    init(_ build: @escaping () -> Content) {
        self.build = build
    }

    var body: some View {
        build()
    }
}
