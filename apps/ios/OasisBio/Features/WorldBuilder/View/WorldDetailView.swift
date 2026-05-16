import SwiftUI

struct WorldDetailView: View {
    let worldId: String
    @StateObject private var viewModel: WorldDetailViewModel
    
    init(worldId: String) {
        self.worldId = worldId
        _viewModel = StateObject(wrappedValue: WorldDetailViewModel())
    }
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    loadingView
                } else if let error = viewModel.error {
                    errorView(error)
                } else if let world = viewModel.world {
                    contentView(world)
                } else {
                    notFoundView
                }
            }
            .navigationTitle("World Details")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                if viewModel.world != nil {
                    ToolbarItem(placement: .primaryAction) {
                        Menu {
                            Button(action: { viewModel.showEditSheet = true }) {
                                Label("Edit", systemImage: "pencil")
                            }
                            Button(role: .destructive, action: { viewModel.showDeleteAlert = true }) {
                                Label("Delete", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
            .sheet(isPresented: $viewModel.showEditSheet) {
                if let world = viewModel.world {
                    WorldEditSheet(world: world, viewModel: viewModel)
                }
            }
            .alert("Delete World", isPresented: $viewModel.showDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    Task { await viewModel.deleteWorld() }
                }
            } message: {
                Text("Are you sure you want to delete this world? This action cannot be undone.")
            }
            .task {
                await viewModel.loadWorld(id: worldId)
            }
            .refreshable {
                await viewModel.loadWorld(id: worldId)
            }
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading...")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func errorView(_ error: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            
            Text("Error")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text(error)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: {
                Task { await viewModel.loadWorld(id: worldId) }
            }) {
                Label("Retry", systemImage: "arrow.clockwise")
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var notFoundView: some View {
        VStack(spacing: 20) {
            Image(systemName: "globe.badge.chevron.backward")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text("World Not Found")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("The world you're looking for doesn't exist or has been deleted.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    @ViewBuilder
    private func contentView(_ world: World) -> some View {
        ScrollView {
            VStack(spacing: 20) {
                headerSection(world)
                completionScoreSection
                charactersSection
                modulesSection(world)
                
                if viewModel.isSaving {
                    savingIndicator
                }
            }
            .padding()
        }
    }
    
    private func headerSection(_ world: World) -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [.blue, .indigo],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 80, height: 80)
                    
                    Image(systemName: "globe")
                        .font(.system(size: 36))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text(world.name)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    if let description = world.description {
                        Text(description)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(3)
                    }
                }
                
                Spacer()
            }
            
            HStack(spacing: 16) {
                Label(formattedDate(world.createdAt), systemImage: "calendar")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(world.status.rawValue.capitalized)
                    .font(.caption)
                    .fontWeight(.medium)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(statusBackgroundColor(world.status))
                    .foregroundColor(statusForegroundColor(world.status))
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
    }
    
    private var completionScoreSection: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Completion Score")
                    .font(.headline)
                Spacer()
            }
            
            HStack(spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                        .frame(width: 80, height: 80)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(viewModel.completionScore) / 100)
                        .stroke(
                            completionScoreColor,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    
                    Text("\(viewModel.completionScore)%")
                        .font(.title3)
                        .fontWeight(.bold)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Array(viewModel.completionBreakdown.keys.sorted()), id: \.self) { key in
                        let breakdown = viewModel.completionBreakdown[key]!
                        HStack {
                            Text(key.capitalized.replacingOccurrences(of: "_", with: " "))
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Text("\(breakdown.filled)/\(breakdown.total)")
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                    }
                }
                
                Spacer()
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
    }
    
    private var charactersSection: some View {
        VStack(spacing: 12) {
            HStack {
                Label("Characters", systemImage: "person.3")
                    .font(.headline)
                Spacer()
                
                Button(action: { viewModel.showAddCharacterSheet = true }) {
                    Image(systemName: "plus.circle")
                }
            }
            
            if viewModel.characters.isEmpty {
                Text("No characters in this world yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(viewModel.characters) { character in
                            CharacterChip(character: character)
                        }
                    }
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
    }
    
    private func modulesSection(_ world: World) -> some View {
        VStack(spacing: 16) {
            HStack {
                Text("World Modules")
                    .font(.headline)
                Spacer()
            }
            
            ForEach(WorldModule.allCases, id: \.self) { module in
                ModuleCard(
                    module: module,
                    world: world,
                    onEdit: {
                        viewModel.selectedModule = module
                        viewModel.showModuleEdit = true
                    }
                )
            }
        }
    }
    
    private var savingIndicator: some View {
        HStack {
            ProgressView()
            Text("Saving...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(12)
        .frame(maxWidth: .infinity)
    }
    
    private var completionScoreColor: Color {
        if viewModel.completionScore >= 80 {
            return .green
        } else if viewModel.completionScore >= 50 {
            return .yellow
        } else {
            return .gray
        }
    }
    
    private func statusBackgroundColor(_ status: WorldStatus) -> Color {
        switch status {
        case .active: return Color.green.opacity(0.2)
        case .draft: return Color.yellow.opacity(0.2)
        case .archived: return Color.gray.opacity(0.2)
        }
    }
    
    private func statusForegroundColor(_ status: WorldStatus) -> Color {
        switch status {
        case .active: return .green
        case .draft: return .yellow
        case .archived: return .gray
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

struct CharacterChip: View {
    let character: Character
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "person.circle.fill")
                .font(.title3)
                .foregroundColor(.blue)
            
            Text(character.name)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.systemGray5))
        .cornerRadius(20)
    }
}

struct ModuleCard: View {
    let module: WorldModule
    let world: World
    let onEdit: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: module.icon)
                    .font(.title3)
                    .foregroundColor(.accentColor)
                    .frame(width: 32)
                
                Text(module.title)
                    .font(.headline)
                
                Spacer()
                
                Button(action: onEdit) {
                    Image(systemName: "pencil.circle")
                        .foregroundColor(.accentColor)
                }
            }
            
            ForEach(module.fields, id: \.self) { field in
                VStack(alignment: .leading, spacing: 4) {
                    Text(field)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let value = getFieldValue(field) {
                        Text(value)
                            .font(.subheadline)
                            .lineLimit(3)
                    } else {
                        Text("Not set")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .italic()
                    }
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(12)
    }
    
    private func getFieldValue(_ field: String) -> String? {
        switch field {
        case "name": return world.name.isEmpty ? nil : world.name
        case "description": return world.description
        case "status": return world.status.rawValue.capitalized
        case "theme": return world.settings?.theme
        case "visibility": return world.settings?.visibility.rawValue.capitalized
        case "template_id": return world.templateId
        default: return nil
        }
    }
}

enum WorldModule: CaseIterable {
    case coreIdentity
    case settings
    case characters
    case locations
    
    var title: String {
        switch self {
        case .coreIdentity: return "Core Identity"
        case .settings: return "Settings"
        case .characters: return "Characters"
        case .locations: return "Locations"
        }
    }
    
    var icon: String {
        switch self {
        case .coreIdentity: return "sparkles"
        case .settings: return "gearshape"
        case .characters: return "person.3"
        case .locations: return "map"
        }
    }
    
    var fields: [String] {
        switch self {
        case .coreIdentity: return ["name", "description"]
        case .settings: return ["status", "theme", "visibility"]
        case .characters: return []
        case .locations: return []
        }
    }
}

struct WorldEditSheet: View {
    let world: World
    @ObservedObject var viewModel: WorldDetailViewModel
    @Environment(\.dismiss) private var dismiss
    
    @State private var name: String = ""
    @State private var description: String = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section("World Details") {
                    TextField("Name", text: $name)
                    TextEditor(text: $description)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Edit World")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await viewModel.updateWorld(name: name, description: description)
                            dismiss()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear {
                name = world.name
                description = world.description ?? ""
            }
        }
    }
}

@MainActor
final class WorldDetailViewModel: ObservableObject {
    @Published var world: World?
    @Published var characters: [Character] = []
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var error: String?
    @Published var showEditSheet = false
    @Published var showDeleteAlert = false
    @Published var showAddCharacterSheet = false
    @Published var showModuleEdit = false
    @Published var selectedModule: WorldModule?
    
    @Published var completionScore: Int = 0
    @Published var completionBreakdown: [String: (filled: Int, total: Int)] = [:]
    
    private let repository: WorldRepositoryProtocol
    
    init(repository: WorldRepositoryProtocol = WorldRepository()) {
        self.repository = repository
    }
    
    func loadWorld(id: String) async {
        isLoading = true
        error = nil
        
        do {
            world = try await repository.getWorld(id: id)
            calculateCompletionScore()
            await loadCharacters(for: id)
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func loadCharacters(for worldId: String) async {
        do {
            let allCharacters = try await OasisBioAPI.shared.getCharacters()
            characters = allCharacters.filter { $0.relatedWorldId == worldId }
        } catch {
            print("Failed to load characters: \(error)")
        }
    }
    
    func updateWorld(name: String, description: String) async {
        guard var updatedWorld = world else { return }
        
        isSaving = true
        
        do {
            let newWorld = World(
                id: updatedWorld.id,
                name: name,
                description: description.isEmpty ? nil : description,
                templateId: updatedWorld.templateId,
                status: updatedWorld.status,
                settings: updatedWorld.settings,
                createdAt: updatedWorld.createdAt,
                updatedAt: Date()
            )
            world = try await repository.updateWorld(id: updatedWorld.id, world: newWorld)
            calculateCompletionScore()
        } catch {
            self.error = error.localizedDescription
        }
        
        isSaving = false
    }
    
    func deleteWorld() async {
        guard let world = world else { return }
        
        do {
            try await repository.deleteWorld(id: world.id)
            self.world = nil
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    private func calculateCompletionScore() {
        guard let world = world else {
            completionScore = 0
            completionBreakdown = [:]
            return
        }
        
        var totalFilled = 0
        var totalFields = 0
        
        var breakdown: [String: (filled: Int, total: Int)] = [:]
        
        let coreFields = ["name", "description"]
        let coreFilled = coreFields.filter { field in
            switch field {
            case "name": return !world.name.isEmpty
            case "description": return world.description != nil
            default: return false
            }
        }.count
        breakdown["core_identity"] = (coreFilled, coreFields.count)
        totalFilled += coreFilled
        totalFields += coreFields.count
        
        let settingsFields = ["status", "theme", "visibility"]
        let settingsFilled = settingsFields.filter { field in
            switch field {
            case "status": return true
            case "theme": return world.settings?.theme != nil
            case "visibility": return world.settings?.visibility != nil
            default: return false
            }
        }.count
        breakdown["settings"] = (settingsFilled, settingsFields.count)
        totalFilled += settingsFilled
        totalFields += settingsFields.count
        
        let characterFilled = min(characters.count, 5)
        breakdown["characters"] = (characterFilled, 5)
        totalFilled += characterFilled
        totalFields += 5
        
        completionBreakdown = breakdown
        completionScore = totalFields > 0 ? Int((Double(totalFilled) / Double(totalFields)) * 100) : 0
    }
}

struct Character: Identifiable {
    let id: String
    let name: String
    let relatedWorldId: String?
}

extension OasisBioAPI {
    func getCharacters() async throws -> [Character] {
        return []
    }
}
