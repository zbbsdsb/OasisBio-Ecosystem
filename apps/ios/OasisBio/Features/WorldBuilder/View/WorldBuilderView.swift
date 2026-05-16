import SwiftUI

struct WorldBuilderView: View {
    @StateObject var viewModel: WorldViewModel
    
    init(viewModel: WorldViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.worlds) { world in
                    WorldCardView(world: world) {
                        viewModel.selectWorld(world)
                    } editAction: {
                        viewModel.editWorld(world)
                    } deleteAction: {
                        Task { await viewModel.deleteWorld(id: world.id) }
                    }
                }
            }
            .listStyle(.plain)
            .overlay {
                if viewModel.worlds.isEmpty {
                    VStack {
                        Image(systemName: "globe")
                            .font(.system(size: 64))
                            .foregroundColor(.secondary)
                        Text("Create your first world")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
            .navigationTitle("World Builder")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: {
                        viewModel.createWorld()
                    }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .onAppear {
                Task { await viewModel.loadWorlds() }
            }
            .sheet(isPresented: $viewModel.isPresentingForm) {
                WorldFormView(viewModel: viewModel)
            }
            .sheet(isPresented: $viewModel.isPresentingDetail) {
                if let world = viewModel.selectedWorld {
                    WorldDetailView(world: world, viewModel: viewModel)
                }
            }
        }
    }
}

struct WorldCardView: View {
    let world: World
    let action: () -> Void
    let editAction: () -> Void
    let deleteAction: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "globe")
                .font(.largeTitle)
                .foregroundColor(.accentColor)
                .padding(12)
                .background(Color(.systemGray5))
                .cornerRadius(12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(world.name)
                    .font(.headline)
                
                if let description = world.description {
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                HStack(spacing: 8) {
                    Text(world.status.rawValue.capitalized)
                        .font(.caption)
                        .padding(4)
                        .background(statusColor)
                        .foregroundColor(statusTextColor)
                        .cornerRadius(4)
                    
                    Text(formattedDate(world.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            HStack(spacing: 8) {
                Button(action: editAction) {
                    Image(systemName: "pencil")
                        .foregroundColor(.secondary)
                }
                
                Button(action: deleteAction) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .onTapGesture(perform: action)
    }
    
    private var statusColor: Color {
        switch world.status {
        case .active: return Color.green.opacity(0.2)
        case .draft: return Color.yellow.opacity(0.2)
        case .archived: return Color.gray.opacity(0.2)
        }
    }
    
    private var statusTextColor: Color {
        switch world.status {
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

struct WorldFormView: View {
    @ObservedObject var viewModel: WorldViewModel
    @State private var name = ""
    @State private var description = ""
    @State private var selectedTemplateId: String?
    
    var body: some View {
        NavigationStack {
            Form {
                Section("World Details") {
                    TextField("Name", text: $name)
                    TextEditor(text: $description)
                        .frame(height: 100)
                        .navigationTitle(viewModel.isEditing ? "Edit World" : "Create World")
                }
                
                Section("Template") {
                    Picker("Select Template", selection: $selectedTemplateId) {
                        Text("None").tag(String?.none)
                        ForEach(viewModel.templates) { template in
                            Text(template.name).tag(String?.some(template.id))
                        }
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        viewModel.isPresentingForm = false
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            do {
                                try await viewModel.saveWorld(
                                    name: name,
                                    description: description.isEmpty ? nil : description,
                                    templateId: selectedTemplateId
                                )
                            } catch {
                                viewModel.error = error.localizedDescription
                            }
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear {
                if let world = viewModel.selectedWorld {
                    name = world.name
                    description = world.description ?? ""
                    selectedTemplateId = world.templateId
                }
                Task { await viewModel.loadTemplates() }
            }
        }
    }
}

struct WorldDetailView: View {
    let world: World
    @ObservedObject var viewModel: WorldViewModel
    
    var body: some View {
        NavigationStack {
            List {
                Section("Details") {
                    HStack {
                        Text("Name")
                        Spacer()
                        Text(world.name)
                    }
                    
                    if let description = world.description {
                        HStack {
                            Text("Description")
                            Spacer()
                            Text(description)
                        }
                    }
                    
                    HStack {
                        Text("Status")
                        Spacer()
                        Text(world.status.rawValue.capitalized)
                            .foregroundColor(statusColor)
                    }
                    
                    if let templateId = world.templateId {
                        HStack {
                            Text("Template")
                            Spacer()
                            Text(templateId)
                        }
                    }
                    
                    HStack {
                        Text("Created")
                        Spacer()
                        Text(formattedDate(world.createdAt))
                    }
                    
                    HStack {
                        Text("Updated")
                        Spacer()
                        Text(formattedDate(world.updatedAt))
                    }
                }
                
                if let settings = world.settings {
                    Section("Settings") {
                        HStack {
                            Text("Theme")
                            Spacer()
                            Text(settings.theme)
                        }
                        
                        HStack {
                            Text("Visibility")
                            Spacer()
                            Text(settings.visibility.rawValue.capitalized)
                        }
                        
                        if let maxParticipants = settings.maxParticipants {
                            HStack {
                                Text("Max Participants")
                                Spacer()
                                Text("\(maxParticipants)")
                            }
                        }
                    }
                }
            }
            .navigationTitle("World Details")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Edit") {
                        viewModel.editWorld(world)
                    }
                }
                
                if world.status != .active {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Activate") {
                            Task { await viewModel.activateWorld(world) }
                        }
                    }
                }
            }
        }
    }
    
    private var statusColor: Color {
        switch world.status {
        case .active: return .green
        case .draft: return .yellow
        case .archived: return .gray
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}