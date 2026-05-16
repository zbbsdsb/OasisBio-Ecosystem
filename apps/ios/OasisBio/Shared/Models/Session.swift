import Foundation

struct Session: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let userId: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresAt = "expires_at"
        case userId = "user_id"
    }
}
