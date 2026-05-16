import Foundation

final class ErrorHandler {
    static let shared = ErrorHandler()
    
    private init() {}
    
    func handle(error: Error) -> String {
        let apiError = asAPIError(error)
        return apiError.errorDescription ?? error.localizedDescription
    }
    
    func asAPIError(_ error: Error) -> APIError {
        if let apiError = error as? APIError {
            return apiError
        }
        
        if let nsError = error as NSError? {
            switch nsError.domain {
            case NSURLErrorDomain:
                switch nsError.code {
                case NSURLErrorNotConnectedToInternet:
                    return .networkError(error)
                case NSURLErrorTimedOut:
                    return .httpError(statusCode: 408)
                default:
                    return .networkError(error)
                }
            default:
                return .unknown
            }
        }
        
        return .unknown
    }
    
    func isRetryable(error: Error) -> Bool {
        let apiError = asAPIError(error)
        switch apiError {
        case .networkError, .serverError, .httpError(let statusCode):
            return statusCode >= 500 || statusCode == 408
        default:
            return false
        }
    }
}

extension APIError {
    var shouldRetry: Bool {
        switch self {
        case .networkError, .serverError, .httpError(let statusCode):
            return statusCode >= 500 || statusCode == 408
        default:
            return false
        }
    }
}