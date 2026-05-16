import Foundation

final class AuthInterceptor {
    static let shared = AuthInterceptor()
    
    private let keychainManager = KeychainManager.shared
    private let expiresAtKey = "OasisBioExpiresAt"
    private let userIdKey = "OasisBioUserId"
    
    private init() {}
    
    func defaultHeaders() -> [String: String] {
        return [
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "OasisBio/iOS"
        ]
    }
    
    func authenticatedHeaders() -> [String: String] {
        var headers = defaultHeaders()
        
        if let token = keychainManager.getAccessToken() {
            headers["Authorization"] = "Bearer \(token)"
        }
        
        return headers
    }
    
    func setSession(_ session: Session) {
        keychainManager.saveAccessToken(session.accessToken)
        keychainManager.saveRefreshToken(session.refreshToken)
        saveExpiresAt(session.expiresAt)
        saveUserId(session.userId)
    }
    
    func clearSession() {
        keychainManager.deleteAccessToken()
        keychainManager.deleteRefreshToken()
        deleteExpiresAt()
        deleteUserId()
    }
    
    func hasValidSession() -> Bool {
        return keychainManager.getAccessToken() != nil && !isTokenExpired()
    }
    
    func getRefreshToken() -> String? {
        keychainManager.getRefreshToken()
    }
    
    func isTokenExpired() -> Bool {
        guard let expiresAt = getExpiresAt() else {
            return true
        }
        return Date() > expiresAt
    }
    
    private func saveExpiresAt(_ date: Date) {
        let timestamp = date.timeIntervalSince1970
        keychainManager.save(key: expiresAtKey, value: String(timestamp))
    }
    
    private func getExpiresAt() -> Date? {
        guard let timestampString = keychainManager.load(key: expiresAtKey),
              let timestamp = Double(timestampString) else {
            return nil
        }
        return Date(timeIntervalSince1970: timestamp)
    }
    
    private func deleteExpiresAt() {
        keychainManager.delete(key: expiresAtKey)
    }
    
    private func saveUserId(_ userId: String) {
        keychainManager.save(key: userIdKey, value: userId)
    }
    
    private func deleteUserId() {
        keychainManager.delete(key: userIdKey)
    }
}
