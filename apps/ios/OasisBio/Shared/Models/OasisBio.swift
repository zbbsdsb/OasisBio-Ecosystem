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
