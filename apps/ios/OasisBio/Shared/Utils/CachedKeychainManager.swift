import Foundation
import Security
import os.log

final class CachedKeychainManager {
    static let shared = CachedKeychainManager()

    private let keychainManager = KeychainManager()
    private let memoryCache: NSCache<NSString, NSString>
    private let accessLog: KeychainAccessLog
    private let logger: Logger
    private let lock = NSLock()
    private let cacheExpiry: TimeInterval = 300

    private init() {
        self.logger = Logger(subsystem: "com.oasisbio.keychain", category: "cached")
        self.memoryCache = NSCache<NSString, NSString>()
        self.memoryCache.countLimit = 20
        self.accessLog = KeychainAccessLog()
        logger.info("CachedKeychainManager initialized with \(cacheExpiry)s cache expiry")
    }

    func saveAccessToken(_ token: String) {
        memoryCache.setObject(token as NSString, forKey: "accessToken" as NSString)
        accessLog.logAccess(key: "accessToken", success: true)
        keychainManager.saveAccessToken(token)
    }

    func getAccessToken() -> String? {
        if let cached = getCachedValue(forKey: "accessToken") {
            accessLog.logAccess(key: "accessToken", success: true, cacheHit: true)
            return cached
        }

        let token = keychainManager.getAccessToken()
        if let token = token {
            memoryCache.setObject(token as NSString, forKey: "accessToken" as NSString)
        }
        accessLog.logAccess(key: "accessToken", success: token != nil, cacheHit: false)
        return token
    }

    func deleteAccessToken() {
        memoryCache.removeObject(forKey: "accessToken" as NSString)
        accessLog.logAccess(key: "accessToken", success: true)
        keychainManager.deleteAccessToken()
    }

    func saveRefreshToken(_ token: String) {
        memoryCache.setObject(token as NSString, forKey: "refreshToken" as NSString)
        accessLog.logAccess(key: "refreshToken", success: true)
        keychainManager.saveRefreshToken(token)
    }

    func getRefreshToken() -> String? {
        if let cached = getCachedValue(forKey: "refreshToken") {
            accessLog.logAccess(key: "refreshToken", success: true, cacheHit: true)
            return cached
        }

        let token = keychainManager.getRefreshToken()
        if let token = token {
            memoryCache.setObject(token as NSString, forKey: "refreshToken" as NSString)
        }
        accessLog.logAccess(key: "refreshToken", success: token != nil, cacheHit: false)
        return token
    }

    func deleteRefreshToken() {
        memoryCache.removeObject(forKey: "refreshToken" as NSString)
        accessLog.logAccess(key: "refreshToken", success: true)
        keychainManager.deleteRefreshToken()
    }

    func save(key: String, value: String) {
        memoryCache.setObject(value as NSString, key as NSString)
        accessLog.logAccess(key: key, success: true)
        keychainManager.save(key: key, value: value)
    }

    func get(key: String) -> String? {
        if let cached = getCachedValue(forKey: key) {
            accessLog.logAccess(key: key, success: true, cacheHit: true)
            return cached
        }

        let value = keychainManager.load(key: key)
        if let value = value {
            memoryCache.setObject(value as NSString, forKey: key as NSString)
        }
        accessLog.logAccess(key: key, success: value != nil, cacheHit: false)
        return value
    }

    func delete(key: String) {
        memoryCache.removeObject(forKey: key as NSString)
        accessLog.logAccess(key: key, success: true)
        keychainManager.delete(key: key)
    }

    func invalidate(key: String) {
        lock.lock()
        memoryCache.removeObject(forKey: key as NSString)
        lock.unlock()
        logger.debug("Invalidated cache for key: \(key)")
    }

    func invalidateAll() {
        lock.lock()
        memoryCache.removeAllObjects()
        lock.unlock()
        accessLog.reset()
        logger.info("Invalidated all cached keychain values")
    }

    func getAccessStats() -> KeychainAccessStats {
        return accessLog.getStats()
    }

    private func getCachedValue(forKey key: String) -> String? {
        lock.lock()
        defer { lock.unlock() }
        return memoryCache.object(forKey: key as NSString) as String?
    }
}

final class KeychainAccessLog {
    private var log: [KeychainAccessEntry] = []
    private let lock = NSLock()
    private let maxLogSize: Int = 100

    struct KeychainAccessEntry {
        let key: String
        let timestamp: Date
        let success: Bool
        let cacheHit: Bool
    }

    struct KeychainAccessStats {
        let totalAccesses: Int
        let cacheHits: Int
        let cacheMisses: Int
        let successCount: Int
        let failureCount: Int
        let cacheHitRate: Double
    }

    func logAccess(key: String, success: Bool, cacheHit: Bool = false) {
        lock.lock()
        defer { lock.unlock() }

        log.append(KeychainAccessEntry(
            key: key,
            timestamp: Date(),
            success: success,
            cacheHit: cacheHit
        ))

        if log.count > maxLogSize {
            log.removeFirst(log.count - maxLogSize)
        }
    }

    func getStats() -> KeychainAccessStats {
        lock.lock()
        defer { lock.unlock() }

        let totalAccesses = log.count
        let cacheHits = log.filter { $0.cacheHit }.count
        let cacheMisses = log.filter { !$0.cacheHit }.count
        let successCount = log.filter { $0.success }.count
        let failureCount = log.filter { !$0.success }.count
        let cacheHitRate = totalAccesses > 0 ? Double(cacheHits) / Double(totalAccesses) * 100 : 0

        return KeychainAccessStats(
            totalAccesses: totalAccesses,
            cacheHits: cacheHits,
            cacheMisses: cacheMisses,
            successCount: successCount,
            failureCount: failureCount,
            cacheHitRate: cacheHitRate
        )
    }

    func reset() {
        lock.lock()
        defer { lock.unlock() }
        log.removeAll()
    }
}
