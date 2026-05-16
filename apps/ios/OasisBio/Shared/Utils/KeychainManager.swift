import Foundation
import Security

final class KeychainManager {
    static let shared = KeychainManager()
    
    private let accessTokenKey = "OasisBioAccessToken"
    private let refreshTokenKey = "OasisBioRefreshToken"
    
    private init() {}
    
    func saveAccessToken(_ token: String) {
        save(key: accessTokenKey, value: token)
    }
    
    func getAccessToken() -> String? {
        load(key: accessTokenKey)
    }
    
    func deleteAccessToken() {
        delete(key: accessTokenKey)
    }
    
    func saveRefreshToken(_ token: String) {
        save(key: refreshTokenKey, value: token)
    }
    
    func getRefreshToken() -> String? {
        load(key: refreshTokenKey)
    }
    
    func deleteRefreshToken() {
        delete(key: refreshTokenKey)
    }
    
    func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var data: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &data)
        
        guard status == errSecSuccess, let resultData = data as? Data else {
            return nil
        }
        
        return String(data: resultData, encoding: .utf8)
    }
    
    func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}
