import Foundation

final class OasisBioAPI {
    static let shared = OasisBioAPI()
    
    private let client = APIClient.shared
    private let authInterceptor = AuthInterceptor.shared
    
    private init() {}
    
    func requestOtp(phone: String) async throws -> OtpResponse {
        let endpoint = "/auth/otp/request"
        let body = try JSONEncoder().encode(["phone": phone])
        let headers = authInterceptor.defaultHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers,
            body: body
        )
    }
    
    func verifyOtp(phone: String, otp: String) async throws -> Session {
        let endpoint = "/auth/otp/verify"
        let body = try JSONEncoder().encode(["phone": phone, "otp": otp])
        let headers = authInterceptor.defaultHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers,
            body: body
        )
    }
    
    func loginWithOAuth(provider: OAuthProvider, token: String) async throws -> Session {
        let endpoint = "/auth/oauth/\(provider.rawValue)"
        let body = try JSONEncoder().encode(["token": token])
        let headers = authInterceptor.defaultHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers,
            body: body
        )
    }
    
    func refreshToken(refreshToken: String) async throws -> Session {
        let endpoint = "/auth/refresh"
        let body = try JSONEncoder().encode(["refresh_token": refreshToken])
        let headers = authInterceptor.defaultHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers,
            body: body
        )
    }
    
    func getUserProfile() async throws -> UserProfile {
        let endpoint = "/users/me"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
    
    func updateUserProfile(_ profile: UserProfile) async throws -> UserProfile {
        let endpoint = "/users/me"
        let body = try JSONEncoder().encode(profile)
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .put,
            headers: headers,
            body: body
        )
    }
    
    func getIdentities(page: Int = 1, limit: Int = 20) async throws -> PaginatedIdentities {
        let endpoint = "/identities?page=\(page)&limit=\(limit)"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
    
    func searchIdentities(query: String) async throws -> [OasisBioIdentity] {
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let endpoint = "/identities/search?q=\(encodedQuery)"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
    
    func getIdentity(id: String) async throws -> OasisBioIdentity {
        let endpoint = "/identities/\(id)"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
    
    func createIdentity(_ identity: OasisBioIdentity) async throws -> OasisBioIdentity {
        let endpoint = "/identities"
        let body = try JSONEncoder().encode(identity)
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers,
            body: body
        )
    }
    
    func updateIdentity(id: String, identity: OasisBioIdentity) async throws -> OasisBioIdentity {
        let endpoint = "/identities/\(id)"
        let body = try JSONEncoder().encode(identity)
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .put,
            headers: headers,
            body: body
        )
    }
    
    func deleteIdentity(id: String) async throws {
        let endpoint = "/identities/\(id)"
        let headers = authInterceptor.authenticatedHeaders()
        
        try await client.request(
            endpoint: endpoint,
            method: .delete,
            headers: headers
        )
    }
}

struct OtpResponse: Decodable {
    let success: Bool
    let message: String
}

struct PaginatedIdentities: Decodable {
    let data: [OasisBioIdentity]
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
    
    enum CodingKeys: String, CodingKey {
        case data
        case total
        case page
        case limit
        case totalPages = "total_pages"
    }
}

// AI Assistant API Endpoints
extension OasisBioAPI {
    func sendMessage(message: String, model: AIModel) async throws -> ChatResponse {
        let endpoint = "/ai/chat"
        let body = try JSONEncoder().encode([
            "message": message,
            "model": model.rawValue
        ])
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers,
            body: body
        )
    }
    
    func getModels() async throws -> [AIModel] {
        let endpoint = "/ai/models"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
    
    func startChat() async throws -> ChatSession {
        let endpoint = "/ai/chat/sessions"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers
        )
    }
    
    func getChatHistory(sessionId: String) async throws -> [ChatMessage] {
        let endpoint = "/ai/chat/sessions/\(sessionId)/messages"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
}

// World Builder API Endpoints
extension OasisBioAPI {
    func getWorlds() async throws -> [World] {
        let endpoint = "/worlds"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
    
    func getWorld(id: String) async throws -> World {
        let endpoint = "/worlds/\(id)"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
    
    func createWorld(_ world: World) async throws -> World {
        let endpoint = "/worlds"
        let body = try JSONEncoder().encode(world)
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .post,
            headers: headers,
            body: body
        )
    }
    
    func updateWorld(id: String, world: World) async throws -> World {
        let endpoint = "/worlds/\(id)"
        let body = try JSONEncoder().encode(world)
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .put,
            headers: headers,
            body: body
        )
    }
    
    func deleteWorld(id: String) async throws {
        let endpoint = "/worlds/\(id)"
        let headers = authInterceptor.authenticatedHeaders()
        
        try await client.request(
            endpoint: endpoint,
            method: .delete,
            headers: headers
        )
    }
    
    func getTemplates() async throws -> [WorldTemplate] {
        let endpoint = "/worlds/templates"
        let headers = authInterceptor.authenticatedHeaders()
        
        return try await client.request(
            endpoint: endpoint,
            method: .get,
            headers: headers
        )
    }
}
