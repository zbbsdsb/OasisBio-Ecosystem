import Foundation
import Combine

final class WorldViewModel: ObservableObject {
    @Published var worlds: [World] = []
    @Published var templates: [WorldTemplate] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var selectedWorld: World?
    @Published var isPresentingDetail = false
    @Published var isPresentingForm = false
    @Published var isEditing = false
    
    private let repository: WorldRepositoryProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(repository: WorldRepositoryProtocol = WorldRepository()) {
        self.repository = repository
    }
    
    func loadWorlds() async {
        isLoading = true
        error = nil
        
        do {
            worlds = try await repository.getWorlds()
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func loadTemplates() async {
        isLoading = true
        error = nil
        
        do {
            templates = try await repository.getTemplates()
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func selectWorld(_ world: World) {
        selectedWorld = world
        isPresentingDetail = true
    }
    
    func createWorld() {
        isEditing = false
        selectedWorld = nil
        isPresentingForm = true
    }
    
    func editWorld(_ world: World) {
        isEditing = true
        selectedWorld = world
        isPresentingForm = true
    }
    
    func saveWorld(name: String, description: String?, templateId: String?) async throws {
        let settings = WorldSettings(
            theme: "default",
            visibility: .private,
            maxParticipants: nil
        )
        
        if let existingWorld = selectedWorld, isEditing {
            var updated = existingWorld
            updated.name = name
            updated.description = description
            updated.templateId = templateId
            _ = try await repository.updateWorld(id: existingWorld.id, world: updated)
        } else {
            let newWorld = World(
                id: UUID().uuidString,
                name: name,
                description: description,
                templateId: templateId,
                status: .draft,
                settings: settings,
                createdAt: Date(),
                updatedAt: Date()
            )
            _ = try await repository.createWorld(newWorld)
        }
        
        isPresentingForm = false
        await loadWorlds()
    }
    
    func deleteWorld(id: String) async {
        do {
            try await repository.deleteWorld(id: id)
            await loadWorlds()
        } catch let err {
            self.error = err.localizedDescription
        }
    }
    
    func activateWorld(_ world: World) async {
        do {
            var updated = world
            updated.status = .active
            updated.updatedAt = Date()
            _ = try await repository.updateWorld(id: world.id, world: updated)
            await loadWorlds()
        } catch let err {
            self.error = err.localizedDescription
        }
    }
}