import Foundation

protocol WorldRepositoryProtocol {
    func getWorlds() async throws -> [World]
    func getWorld(id: String) async throws -> World
    func createWorld(_ world: World) async throws -> World
    func updateWorld(id: String, world: World) async throws -> World
    func deleteWorld(id: String) async throws
    func getTemplates() async throws -> [WorldTemplate]
}

struct World: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let templateId: String?
    let status: WorldStatus
    let settings: WorldSettings?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case templateId = "template_id"
        case status
        case settings
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

enum WorldStatus: String, Codable {
    case draft
    case active
    case archived
}

struct WorldSettings: Codable {
    let theme: String
    let visibility: WorldVisibility
    let maxParticipants: Int?
    
    enum CodingKeys: String, CodingKey {
        case theme
        case visibility
        case maxParticipants = "max_participants"
    }
}

enum WorldVisibility: String, Codable {
    case public
    case private
    case restricted
}

struct WorldTemplate: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let category: String
    let thumbnail: String?
}

final class WorldRepository: WorldRepositoryProtocol {
    private let api = OasisBioAPI.shared
    
    func getWorlds() async throws -> [World] {
        try await api.getWorlds()
    }
    
    func getWorld(id: String) async throws -> World {
        try await api.getWorld(id: id)
    }
    
    func createWorld(_ world: World) async throws -> World {
        try await api.createWorld(world)
    }
    
    func updateWorld(id: String, world: World) async throws -> World {
        try await api.updateWorld(id: id, world: world)
    }
    
    func deleteWorld(id: String) async throws {
        try await api.deleteWorld(id: id)
    }
    
    func getTemplates() async throws -> [WorldTemplate] {
        try await api.getTemplates()
    }
}