import Foundation

final class RetryService {
    static let shared = RetryService()
    
    private let maxRetries = 3
    private let delayFactor = 1.0
    
    private init() {}
    
    func execute<T>(
        maxRetries: Int = 3,
        delayFactor: TimeInterval = 1.0,
        operation: @escaping () async throws -> T
    ) async throws -> T {
        var lastError: Error?
        
        for attempt in 0..<maxRetries {
            do {
                return try await operation()
            } catch {
                lastError = error
                
                if attempt < maxRetries - 1, shouldRetry(error) {
                    let delay = pow(delayFactor, Double(attempt)) * 1_000_000_000
                    try await Task.sleep(nanoseconds: UInt64(delay))
                    continue
                }
                
                throw error
            }
        }
        
        throw lastError ?? APIError.unknown
    }
    
    private func shouldRetry(_ error: Error) -> Bool {
        ErrorHandler.shared.isRetryable(error: error)
    }
}

extension APIClient {
    func requestWithRetry<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        headers: [String: String] = [:],
        body: Data? = nil,
        maxRetries: Int = 3
    ) async throws -> T {
        try await RetryService.shared.execute(maxRetries: maxRetries) {
            try await self.request(
                endpoint: endpoint,
                method: method,
                headers: headers,
                body: body
            )
        }
    }
}