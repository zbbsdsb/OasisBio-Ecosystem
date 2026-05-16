import Foundation

struct UserProfile: Codable, Identifiable {
    let id: String
    let phone: String
    let name: String?
    let email: String?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case phone
        case name
        case email
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
