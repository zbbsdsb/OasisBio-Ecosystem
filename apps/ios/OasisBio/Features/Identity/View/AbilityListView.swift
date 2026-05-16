import SwiftUI

struct AbilityListView: View {
    @StateObject var viewModel: AbilityViewModel
    @State private var showingFilterSheet = false
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.abilities.isEmpty {
                    loadingView
                } else if let error = viewModel.error, viewModel.abilities.isEmpty {
                    errorView(error)
                } else if viewModel.abilities.isEmpty {
                    emptyView
                } else {
                    abilityList
                }
            }
            .navigationTitle("能力管理")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        filterButton
                        addButton
                    }
                }
            }
            .searchable(text: $viewModel.searchQuery, prompt: "搜索能力")
            .onAppear {
                Task {
                    await viewModel.loadAbilities()
                }
            }
            .refreshable {
                await viewModel.loadAbilities()
            }
            .sheet(isPresented: $showingFilterSheet) {
                FilterSheetView(
                    selectedFilter: $viewModel.selectedFilter,
                    onApply: {
                        showingFilterSheet = false
                    }
                )
            }
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            
            Text("加载能力列表...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func errorView(_ error: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(.orange)
            
            Text("加载失败")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(error)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: {
                Task {
                    await viewModel.loadAbilities()
                }
            }) {
                Label("重试", systemImage: "arrow.clockwise")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var emptyView: some View {
        VStack(spacing: 24) {
            Image(systemName: "bolt.slash")
                .font(.system(size: 80))
                .foregroundColor(.secondary)
            
            VStack(spacing: 8) {
                Text("还没有能力")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("创建你的第一个能力")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Button(action: {
                viewModel.createAbility()
            }) {
                Label("创建能力", systemImage: "plus")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var abilityList: some View {
        List {
            if let filter = viewModel.selectedFilter {
                filterIndicator(filter)
            }
            
            ForEach(viewModel.filteredAbilities) { ability in
                AbilityRow(ability: ability)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        viewModel.selectAbility(ability)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            Task {
                                await viewModel.deleteAbility(id: ability.id)
                            }
                        } label: {
                            Label("删除", systemImage: "trash")
                        }
                        
                        Button {
                            Task {
                                await viewModel.toggleAbilityStatus(ability)
                            }
                        } label: {
                            Label(
                                ability.isActive ? "禁用" : "启用",
                                systemImage: ability.isActive ? "pause.circle" : "play.circle"
                            )
                        }
                        .tint(ability.isActive ? .orange : .green)
                    }
                    .swipeActions(edge: .leading) {
                        Button {
                            viewModel.editAbility(ability)
                        } label: {
                            Label("编辑", systemImage: "pencil")
                        }
                        .tint(.blue)
                    }
            }
            
            if viewModel.hasMore {
                loadMoreSection
            }
        }
        .listStyle(.plain)
    }
    
    private func filterIndicator(_ filter: AbilityType) -> some View {
        HStack {
            Label(filter.displayName, systemImage: filter.icon)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(abilityColor(for: filter))
            
            Spacer()
            
            Button(action: {
                viewModel.filterByType(nil)
            }) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .listRowSeparator(.hidden)
    }
    
    private var loadMoreSection: some View {
        Section {
            HStack {
                Spacer()
                ProgressView()
                    .onAppear {
                        Task {
                            await viewModel.loadMore()
                        }
                    }
                Spacer()
            }
            .listRowSeparator(.hidden)
        }
    }
    
    private var filterButton: some View {
        Button(action: {
            showingFilterSheet = true
        }) {
            Image(systemName: viewModel.selectedFilter != nil ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                .foregroundColor(viewModel.selectedFilter != nil ? .blue : .primary)
        }
    }
    
    private var addButton: some View {
        Button(action: {
            viewModel.createAbility()
        }) {
            Image(systemName: "plus")
        }
    }
    
    private func abilityColor(for type: AbilityType) -> Color {
        switch type {
        case .elemental: return .red
        case .mental: return .purple
        case .physical: return .green
        case .temporal: return .blue
        case .spatial: return .orange
        case .energy: return .yellow
        case .defensive: return .cyan
        case .offensive: return .red
        case .support: return .pink
        case .utility: return .gray
        }
    }
}

struct AbilityRow: View {
    let ability: OasisBioAbility
    
    @State private var isPressed = false
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(abilityTypeColor.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                Image(systemName: ability.type.icon)
                    .font(.system(size: 24))
                    .foregroundColor(abilityTypeColor)
            }
            .scaleEffect(isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
            
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(ability.name)
                        .font(.headline)
                        .foregroundColor(ability.isActive ? .primary : .secondary)
                    
                    if !ability.isActive {
                        Text("已禁用")
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.gray)
                            .cornerRadius(4)
                    }
                }
                
                HStack(spacing: 12) {
                    Label(ability.type.displayName, systemImage: ability.type.icon)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Label("\(ability.usageCount)", systemImage: "chart.bar")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let description = ability.description, !description.isEmpty {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
                .scaleEffect(isPressed ? 0.8 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: 0) {
            isPressed = true
        } onPressingChanged: { pressing in
            isPressed = pressing
        }
    }
    
    private var abilityTypeColor: Color {
        switch ability.type {
        case .elemental: return .red
        case .mental: return .purple
        case .physical: return .green
        case .temporal: return .blue
        case .spatial: return .orange
        case .energy: return .yellow
        case .defensive: return .cyan
        case .offensive: return .red
        case .support: return .pink
        case .utility: return .gray
        }
    }
}

struct FilterSheetView: View {
    @Binding var selectedFilter: AbilityType?
    let onApply: () -> Void
    
    var body: some View {
        NavigationStack {
            List {
                Section("筛选类型") {
                    Button(action: {
                        selectedFilter = nil
                        onApply()
                    }) {
                        HStack {
                            Label("全部", systemImage: "square.grid.2x2")
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            if selectedFilter == nil {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    
                    ForEach(AbilityType.allCases, id: \.self) { type in
                        Button(action: {
                            selectedFilter = type
                            onApply()
                        }) {
                            HStack {
                                Label(type.displayName, systemImage: type.icon)
                                    .foregroundColor(.primary)
                                
                                Spacer()
                                
                                if selectedFilter == type {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("筛选能力")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完成") {
                        onApply()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

#Preview {
    AbilityListView(viewModel: AbilityViewModel(repository: AbilityRepository()))
}
