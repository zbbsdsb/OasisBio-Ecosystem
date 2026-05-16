import Foundation
import os.log

final class CacheManager {
    static let shared = CacheManager()

    private let memoryCache: ThreadSafeNSCache<NSString, AnyObject>
    private let lruTracker: LRUCacheTracker
    private let fileCache: FileCacheManager
    private let logger: Logger
    private let maxMemoryCost: Int
    private let maxDiskCost: Int

    private init() {
        self.logger = Logger(subsystem: "com.oasisbio.cache", category: "manager")
        self.maxMemoryCost = 50 * 1024 * 1024
        self.maxDiskCost = 200 * 1024 * 1024
        self.memoryCache = ThreadSafeNSCache<NSString, AnyObject>()
        self.memoryCache.totalCostLimit = maxMemoryCost
        self.lruTracker = LRUCacheTracker()
        self.fileCache = FileCacheManager()
        self.setupMemoryWarningObserver()
        logger.info("CacheManager initialized with memory limit: \(self.maxMemoryCost / 1024 / 1024)MB, disk limit: \(self.maxDiskCost / 1024 / 1024)MB")
    }

    private func setupMemoryWarningObserver() {
        NotificationCenter.default.addObserver(
            forName: UIApplication.didReceiveMemoryWarningNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleMemoryWarning()
        }
    }

    private func handleMemoryWarning() {
        logger.warning("Memory warning received, clearing memory cache")
        clearMemoryCache()
        lruTracker.reset()
    }

    func set<T: Codable>(_ value: T, forKey key: String, cacheType: CacheType = .memory, cost: Int? = nil) {
        let cacheKey = NSString(string: key)

        switch cacheType {
        case .memory:
            let memoryCost = cost ?? estimateCost(for: value)
            memoryCache.setObject(value as AnyObject, forKey: cacheKey, cost: memoryCost)
            lruTracker.access(key: key)
            logger.debug("Cached in memory: \(key) (cost: \(memoryCost))")

        case .disk:
            fileCache.store(value, forKey: key)
            logger.debug("Cached on disk: \(key)")

        case .hybrid:
            let memoryCost = cost ?? estimateCost(for: value)
            memoryCache.setObject(value as AnyObject, forKey: cacheKey, cost: memoryCost)
            lruTracker.access(key: key)
            fileCache.store(value, forKey: key)
            logger.debug("Cached in hybrid: \(key)")
        }
    }

    func get<T: Codable>(_ type: T.Type, forKey key: String, cacheType: CacheType = .memory) -> T? {
        let cacheKey = NSString(string: key)

        if cacheType == .memory || cacheType == .hybrid {
            if let cached = memoryCache.object(forKey: cacheKey) as? T {
                lruTracker.access(key: key)
                logger.debug("Memory cache hit: \(key)")
                return cached
            }
        }

        if cacheType == .disk || cacheType == .hybrid {
            if let cached: T = fileCache.retrieve(forKey: key) {
                logger.debug("Disk cache hit: \(key)")
                return cached
            }
        }

        logger.debug("Cache miss: \(key)")
        return nil
    }

    func remove(forKey key: String, cacheType: CacheType = .all) {
        let cacheKey = NSString(string: key)

        if cacheType == .memory || cacheType == .all {
            memoryCache.removeObject(forKey: cacheKey)
        }

        if cacheType == .disk || cacheType == .all {
            fileCache.remove(forKey: key)
        }

        lruTracker.remove(key: key)
        logger.debug("Removed from cache: \(key)")
    }

    func clearMemoryCache() {
        memoryCache.removeAllObjects()
        lruTracker.reset()
        logger.info("Memory cache cleared")
    }

    func clearDiskCache() {
        fileCache.clearAll()
        logger.info("Disk cache cleared")
    }

    func clearAll() {
        clearMemoryCache()
        clearDiskCache()
        logger.info("All caches cleared")
    }

    func contains(key: String) -> Bool {
        let cacheKey = NSString(string: key)
        return memoryCache.object(forKey: cacheKey) != nil || fileCache.exists(forKey: key)
    }

    func preload<T: Codable>(_ items: [(key: String, value: T)], cacheType: CacheType = .memory) {
        for item in items {
            set(item.value, forKey: item.key, cacheType: cacheType)
        }
        logger.info("Preloaded \(items.count) items")
    }

    func pruneLRU() {
        let keysToRemove = lruTracker.getEvictableKeys(count: 10)
        for key in keysToRemove {
            remove(forKey: key, cacheType: .memory)
        }
        logger.info("Pruned \(keysToRemove.count) LRU items")
    }

    func getCacheStats() -> CacheStats {
        return CacheStats(
            memoryCacheSize: memoryCache.totalCostLimit,
            currentMemoryUsage: lruTracker.currentSize(),
            diskCacheSize: fileCache.currentSize(),
            itemCount: lruTracker.itemCount()
        )
    }

    private func estimateCost<T>(for value: T) -> Int {
        if let data = try? JSONEncoder().encode(value) {
            return data.count
        }
        return 1024
    }
}

enum CacheType {
    case memory
    case disk
    case hybrid
    case all
}

struct CacheStats {
    let memoryCacheSize: Int
    let currentMemoryUsage: Int
    let diskCacheSize: Int
    let itemCount: Int

    var memoryUsagePercent: Double {
        guard memoryCacheSize > 0 else { return 0 }
        return Double(currentMemoryUsage) / Double(memoryCacheSize) * 100
    }
}

final class ThreadSafeNSCache<Key: AnyObject, Object: AnyObject> {
    private let cache = NSCache<Key, Object>()
    private let lock = NSLock()

    var totalCostLimit: Int {
        get { cache.totalCostLimit }
        set { cache.totalCostLimit = newValue }
    }

    var countLimit: Int {
        get { cache.countLimit }
        set { cache.countLimit = newValue }
    }

    func object(forKey key: Key) -> Object? {
        lock.lock()
        defer { lock.unlock() }
        return cache.object(forKey: key)
    }

    func setObject(_ obj: Object, forKey key: Key, cost cost: Int) {
        lock.lock()
        defer { lock.unlock() }
        cache.setObject(obj, forKey: key, cost: cost)
    }

    func removeObject(forKey key: Key) {
        lock.lock()
        defer { lock.unlock() }
        cache.removeObject(forKey: key)
    }

    func removeAllObjects() {
        lock.lock()
        defer { lock.unlock() }
        cache.removeAllObjects()
    }
}

final class LRUCacheTracker {
    private var accessOrder: [String] = []
    private var keyToIndex: [String: Int] = [:]
    private let lock = NSLock()
    private let maxItems: Int = 500

    func access(key: String) {
        lock.lock()
        defer { lock.unlock() }

        if let index = keyToIndex[key] {
            accessOrder.remove(at: index)
            accessOrder.append(key)
            keyToIndex[key] = accessOrder.count - 1
            updateIndices()
        } else {
            if accessOrder.count >= maxItems {
                evictOldest()
            }
            accessOrder.append(key)
            keyToIndex[key] = accessOrder.count - 1
        }
    }

    func remove(key: String) {
        lock.lock()
        defer { lock.unlock() }

        if let index = keyToIndex[key] {
            accessOrder.remove(at: index)
            keyToIndex.removeValue(forKey: key)
            updateIndices()
        }
    }

    func reset() {
        lock.lock()
        defer { lock.unlock() }

        accessOrder.removeAll()
        keyToIndex.removeAll()
    }

    func getEvictableKeys(count: Int) -> [String] {
        lock.lock()
        defer { lock.unlock() }

        let evictCount = min(count, max(0, accessOrder.count - 10))
        let keysToEvict = Array(accessOrder.prefix(evictCount))

        for key in keysToEvict {
            accessOrder.removeFirst()
            keyToIndex.removeValue(forKey: key)
        }

        updateIndices()
        return keysToEvict
    }

    func currentSize() -> Int {
        lock.lock()
        defer { lock.unlock() }
        return accessOrder.count
    }

    func itemCount() -> Int {
        lock.lock()
        defer { lock.unlock() }
        return accessOrder.count
    }

    private func evictOldest() {
        guard !accessOrder.isEmpty else { return }
        let oldest = accessOrder.removeFirst()
        keyToIndex.removeValue(forKey: oldest)
        updateIndices()
    }

    private func updateIndices() {
        keyToIndex.removeAll()
        for (index, key) in accessOrder.enumerated() {
            keyToIndex[key] = index
        }
    }
}

import UIKit
