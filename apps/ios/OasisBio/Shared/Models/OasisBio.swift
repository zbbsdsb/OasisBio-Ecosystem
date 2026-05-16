import Foundation

struct OasisBioIdentity: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let type: IdentityType
    let status: IdentityStatus
    let metadata: [String: String]?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case type
        case status
        case metadata
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

enum IdentityType: String, Codable {
    case personal
    case organization
    case device
    case service
}

enum IdentityStatus: String, Codable {
    case active
    case inactive
    case pending
    case revoked
}

struct OasisBioAbility: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let type: AbilityType
    let usageCount: Int
    let isActive: Bool
    let metadata: [String: String]?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case type
        case usageCount = "usage_count"
        case isActive = "is_active"
        case metadata
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

enum AbilityType: String, Codable, CaseIterable {
    case elemental
    case mental
    case physical
    case temporal
    case spatial
    case energy
    case defensive
    case offensive
    case support
    case utility
    
    var displayName: String {
        switch self {
        case .elemental: return "元素系"
        case .mental: return "精神系"
        case .physical: return "物理系"
        case .temporal: return "时间系"
        case .spatial: return "空间系"
        case .energy: return "能量系"
        case .defensive: return "防御系"
        case .offensive: return "攻击系"
        case .support: return "辅助系"
        case .utility: return "功能系"
        }
    }
    
    var icon: String {
        switch self {
        case .elemental: return "flame"
        case .mental: return "brain.head.profile"
        case .physical: return "figure.arms.open"
        case .temporal: return "clock"
        case .spatial: return "arrow.up.left.and.arrow.down.right"
        case .energy: return "bolt"
        case .defensive: return "shield"
        case .offensive: return "bolt.fill"
        case .support: return "hands.clasp"
        case .utility: return "wrench.and.screwdriver"
        }
    }
    
    var color: String {
        switch self {
        case .elemental: return "red"
        case .mental: return "purple"
        case .physical: return "green"
        case .temporal: return "blue"
        case .spatial: return "orange"
        case .energy: return "yellow"
        case .defensive: return "cyan"
        case .offensive: return "red"
        case .support: return "pink"
        case .utility: return "gray"
        }
    }
}

struct PaginatedAbilities: Codable {
    let data: [OasisBioAbility]
    let page: Int
    let totalPages: Int
    let totalCount: Int
    
    enum CodingKeys: String, CodingKey {
        case data
        case page
        case totalPages = "total_pages"
        case totalCount = "total_count"
    }
}
