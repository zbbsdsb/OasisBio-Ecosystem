import Foundation

protocol AIRepositoryProtocol {
    func sendMessage(message: String, model: AIModel) async throws -> ChatResponse
    func getModels() async throws -> [AIModel]
    func startChat() async throws -> ChatSession
    func getChatHistory(sessionId: String) async throws -> [ChatMessage]
}

enum AIModel: String, Codable {
    case deo = "deo"
    case dia = "dia"
    
    var displayName: String {
        switch self {
        case .deo: return "Deo"
        case .dia: return "Dia"
        }
    }
}

struct ChatSession: Codable {
    let id: String
    let model: AIModel
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case model
        case createdAt = "created_at"
    }
}

struct ChatMessage: Codable {
    let id: String
    let role: MessageRole
    let content: String
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case role
        case content
        case createdAt = "created_at"
    }
}

enum MessageRole: String, Codable {
    case user
    case assistant
    case system
}

struct ChatResponse: Codable {
    let id: String
    let model: AIModel
    let choices: [ChatChoice]
    
    struct ChatChoice: Codable {
        let message: ChatMessage
        let finishReason: String?
        
        enum CodingKeys: String, CodingKey {
            case message
            case finishReason = "finish_reason"
        }
    }
}

final class AIRepository: AIRepositoryProtocol {
    private let api = OasisBioAPI.shared
    
    func sendMessage(message: String, model: AIModel) async throws -> ChatResponse {
        try await api.sendMessage(message: message, model: model)
    }
    
    func getModels() async throws -> [AIModel] {
        try await api.getModels()
    }
    
    func startChat() async throws -> ChatSession {
        try await api.startChat()
    }
    
    func getChatHistory(sessionId: String) async throws -> [ChatMessage] {
        try await api.getChatHistory(sessionId: sessionId)
    }
}