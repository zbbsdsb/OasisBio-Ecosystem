import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)
    case networkError(Error)
    case unauthorized
    case forbidden
    case notFound
    case serverError
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized access"
        case .forbidden:
            return "Forbidden"
        case .notFound:
            return "Resource not found"
        case .serverError:
            return "Server error"
        case .unknown:
            return "Unknown error"
        }
    }
}
