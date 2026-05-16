import Foundation

struct ChatMessage: Codable, Identifiable {
    let id: String
    let role: MessageRole
    let content: String
    let timestamp: Date
    let identityId: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case role
        case content
        case timestamp
        case identityId = "identity_id"
    }
}

enum MessageRole: String, Codable {
    case user
    case assistant
    case system
}

struct ChatCompletionRequest: Codable {
    let identityId: String
    let messages: [ChatMessage]
    let maxTokens: Int
    let temperature: Double
    
    enum CodingKeys: String, CodingKey {
        case identityId = "identity_id"
        case messages
        case maxTokens = "max_tokens"
        case temperature
    }
}

struct ChatCompletionResponse: Codable {
    let id: String
    let choices: [ChatChoice]
    let usage: Usage
    
    struct ChatChoice: Codable {
        let message: ChatMessage
        let finishReason: String
        
        enum CodingKeys: String, CodingKey {
            case message
            case finishReason = "finish_reason"
        }
    }
    
    struct Usage: Codable {
        let promptTokens: Int
        let completionTokens: Int
        let totalTokens: Int
        
        enum CodingKeys: String, CodingKey {
            case promptTokens = "prompt_tokens"
            case completionTokens = "completion_tokens"
            case totalTokens = "total_tokens"
        }
    }
}
