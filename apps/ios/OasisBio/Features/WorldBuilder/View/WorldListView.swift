import SwiftUI

struct WorldListView: View {
    @StateObject private var viewModel = WorldViewModel()
    @State private var searchText = ""
    @State private var selectedWorld: World?
    @State private var showingCreateSheet = false
    
    private var filteredWorlds: [World] {
        if searchText.isEmpty {
            return viewModel.worlds
        }
        return viewModel.worlds.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.worlds.isEmpty {
                    loadingView
                } else if let error = viewModel.error, viewModel.worlds.isEmpty {
                    errorView(message: error)
                } else if viewModel.worlds.isEmpty {
                    emptyStateView
                } else {
                    worldListContent
                }
            }
            .navigationTitle("世界")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCreateSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .searchable(text: $searchText, prompt: "搜索世界")
            .sheet(isPresented: $showingCreateSheet) {
                WorldBuilderView()
            }
            .navigationDestination(for: World.self) { world in
                WorldDetailView(world: world)
            }
        }
        .task {
            await viewModel.loadWorlds()
        }
        .refreshable {
            await viewModel.loadWorlds()
        }
    }
    
    @ViewBuilder
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("加载中...")
                .foregroundColor(.secondary)
        }
    }
    
    @ViewBuilder
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            
            Text("加载失败")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button("重试") {
                Task {
                    await viewModel.loadWorlds()
                }
            }
            .buttonStyle(.borderedProminent)
        }
    }
    
    @ViewBuilder
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.blue, .indigo],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)
                
                Image(systemName: "globe")
                    .font(.system(size: 40))
                    .foregroundColor(.white)
            }
            
            VStack(spacing: 8) {
                Text("暂无世界")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text("创建您的第一个虚构世界\n开始构建独特的故事和角色")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Button {
                showingCreateSheet = true
            } label: {
                Label("创建世界", systemImage: "plus.circle")
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
    
    @ViewBuilder
    private var worldListContent: some View {
        VirtualList(filteredWorlds, spacing: 12) { world in
            WorldRowView(world: world)
                .onTapGesture {
                    selectedWorld = world
                }
        }
        .padding(.horizontal)
        .overlay {
            if !searchText.isEmpty && filteredWorlds.isEmpty {
                noResultsView
            }
        }
    }
    
    @ViewBuilder
    private var noResultsView: some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 40))
                .foregroundColor(.secondary)
            
            Text("未找到匹配的世界")
                .font(.headline)
                .foregroundColor(.secondary)
        }
    }
}

struct WorldRowView: View {
    let world: World
    
    @State private var isPressed = false
    
    var body: some View {
        NavigationLink(value: world) {
            HStack(spacing: 16) {
                worldIcon
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(world.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    if let description = world.description, !description.isEmpty {
                        Text(description)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    
                    HStack(spacing: 8) {
                        statusBadge
                        Text(world.updatedAt, style: .relative)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(.ultraThinMaterial)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 3, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        .onLongPressGesture(minimumDuration: 0) {
            isPressed = true
        } onPressingChanged: { pressing in
            isPressed = pressing
        }
    }
    
    @ViewBuilder
    private var worldIcon: some View {
        ZStack {
            Circle()
                .fill(iconBackgroundColor)
                .frame(width: 50, height: 50)
            
            Image(systemName: "globe")
                .font(.system(size: 24))
                .foregroundColor(iconColor)
        }
    }
    
    @ViewBuilder
    private var statusBadge: some View {
        Text(statusText)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(statusColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.15))
            .cornerRadius(8)
    }
    
    private var iconBackgroundColor: Color {
        switch world.status {
        case .active:
            return Color.green.opacity(0.15)
        case .draft:
            return Color.orange.opacity(0.15)
        case .archived:
            return Color.gray.opacity(0.15)
        }
    }
    
    private var iconColor: Color {
        switch world.status {
        case .active:
            return .green
        case .draft:
            return .orange
        case .archived:
            return .gray
        }
    }
    
    private var statusText: String {
        switch world.status {
        case .active:
            return "活跃"
        case .draft:
            return "草稿"
        case .archived:
            return "已归档"
        }
    }
    
    private var statusColor: Color {
        switch world.status {
        case .active:
            return .green
        case .draft:
            return .orange
        case .archived:
            return .gray
        }
    }
}

struct WorldDetailView: View {
    let world: World
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                headerSection
                
                if let description = world.description, !description.isEmpty {
                    descriptionSection(description)
                }
                
                settingsSection
            }
            .padding()
        }
        .navigationTitle(world.name)
        .navigationBarTitleDisplayMode(.large)
    }
    
    @ViewBuilder
    private var headerSection: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.blue, .indigo],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 100, height: 100)
                
                Image(systemName: "globe")
                    .font(.system(size: 50))
                    .foregroundColor(.white)
            }
            
            VStack(spacing: 4) {
                Text(world.name)
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("创建于 \(world.createdAt, style: .date)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
    }
    
    @ViewBuilder
    private func descriptionSection(_ description: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("描述")
                .font(.headline)
            
            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial)
        .cornerRadius(12)
    }
    
    @ViewBuilder
    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("设置")
                .font(.headline)
            
            if let settings = world.settings {
                settingRow(title: "主题", value: settings.theme)
                settingRow(title: "可见性", value: visibilityText(settings.visibility))
                if let maxParticipants = settings.maxParticipants {
                    settingRow(title: "最大参与人数", value: "\(maxParticipants)")
                }
            } else {
                Text("暂无设置信息")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial)
        .cornerRadius(12)
    }
    
    @ViewBuilder
    private func settingRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }
    
    private func visibilityText(_ visibility: WorldVisibility) -> String {
        switch visibility {
        case .public:
            return "公开"
        case .private:
            return "私密"
        case .restricted:
            return "受限"
        }
    }
}
