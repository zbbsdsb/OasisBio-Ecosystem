import Foundation
import os.log

final class FileCacheManager {
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    private let maxCacheSize: Int
    private let logger: Logger
    private let lock = NSLock()
    private let expiryInterval: TimeInterval = 86400 * 7

    init(maxCacheSize: Int = 200 * 1024 * 1024) {
        self.logger = Logger(subsystem: "com.oasisbio.cache", category: "file")
        self.maxCacheSize = maxCacheSize

        let cacheDir = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first!
        self.cacheDirectory = cacheDir.appendingPathComponent("OasisBioFileCache", isDirectory: true)

        createCacheDirectoryIfNeeded()
        scheduleCleanup()
    }

    private func createCacheDirectoryIfNeeded() {
        if !fileManager.fileExists(atPath: cacheDirectory.path) {
            try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        }
    }

    func store<T: Codable>(_ value: T, forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        let fileURL = cacheFileURL(for: key)
        let metadata = CacheMetadata(
            key: key,
            createdAt: Date(),
            expiresAt: Date().addingTimeInterval(expiryInterval),
            size: 0
        )

        do {
            let data = try JSONEncoder().encode(value)
            let wrapper = CacheWrapper(data: data, metadata: metadata)
            let wrappedData = try JSONEncoder().encode(wrapper)

            try wrappedData.write(to: fileURL, options: .atomic)

            var updatedMetadata = metadata
            updatedMetadata.size = wrappedData.count
            try updateMetadata(updatedMetadata, forKey: key)

            pruneIfNeeded()
            logger.debug("Stored file cache: \(key) (\(wrappedData.count) bytes)")
        } catch {
            logger.error("Failed to store file cache: \(key) - \(error.localizedDescription)")
        }
    }

    func retrieve<T: Codable>(forKey key: String) -> T? {
        lock.lock()
        defer { lock.unlock() }

        let fileURL = cacheFileURL(for: key)

        guard fileManager.fileExists(atPath: fileURL.path) else {
            return nil
        }

        do {
            let wrappedData = try Data(contentsOf: fileURL)
            let wrapper = try JSONDecoder().decode(CacheWrapper.self, from: wrappedData)

            if let expiresAt = wrapper.metadata.expiresAt, Date() > expiresAt {
                try? fileManager.removeItem(at: fileURL)
                removeMetadata(forKey: key)
                logger.debug("Cache expired: \(key)")
                return nil
            }

            return try JSONDecoder().decode(T.self, from: wrapper.data)
        } catch {
            logger.error("Failed to retrieve file cache: \(key) - \(error.localizedDescription)")
            return nil
        }
    }

    func remove(forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        let fileURL = cacheFileURL(for: key)
        try? fileManager.removeItem(at: fileURL)
        removeMetadata(forKey: key)
    }

    func exists(forKey key: String) -> Bool {
        let fileURL = cacheFileURL(for: key)
        return fileManager.fileExists(atPath: fileURL.path)
    }

    func currentSize() -> Int {
        lock.lock()
        defer { lock.unlock() }

        return getMetadataList().reduce(0) { $0 + ($1.size ?? 0) }
    }

    func clearAll() {
        lock.lock()
        defer { lock.unlock() }

        try? fileManager.removeItem(at: cacheDirectory)
        createCacheDirectoryIfNeeded()
        clearMetadata()
        logger.info("File cache cleared")
    }

    func clearExpired() {
        lock.lock()
        defer { lock.unlock() }

        let now = Date()
        let metadataList = getMetadataList()

        for metadata in metadataList {
            if let expiresAt = metadata.expiresAt, now > expiresAt {
                remove(forKey: metadata.key)
            }
        }

        logger.info("Cleared expired cache entries")
    }

    private func pruneIfNeeded() {
        let currentSize = self.currentSize()

        guard currentSize > maxCacheSize else { return }

        var metadataList = getMetadataList()
        metadataList.sort { ($0.lastAccessedAt ?? $0.createdAt) < ($1.lastAccessedAt ?? $0.createdAt) }

        var freedSize = 0
        let targetFreeSize = currentSize - maxCacheSize + (maxCacheSize / 4)

        for metadata in metadataList {
            if freedSize >= targetFreeSize { break }

            let fileURL = cacheFileURL(for: metadata.key)
            if let fileSize = try? fileManager.attributesOfItem(atPath: fileURL.path)[.size] as? Int {
                freedSize += fileSize
                try? fileManager.removeItem(at: fileURL)
                removeMetadata(forKey: metadata.key)
            }
        }

        logger.info("Pruned file cache, freed \(freedSize / 1024 / 1024)MB")
    }

    private func scheduleCleanup() {
        Task {
            clearExpired()
        }
    }

    private func cacheFileURL(for key: String) -> URL {
        let hashedKey = key.data(using: .utf8)!.base64EncodedString()
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "+", with: "-")
        return cacheDirectory.appendingPathComponent("\(hashedKey).cache")
    }

    private var metadataURL: URL {
        cacheDirectory.appendingPathComponent("metadata.json")
    }

    private func getMetadataList() -> [CacheMetadata] {
        guard let data = try? Data(contentsOf: metadataURL),
              let list = try? JSONDecoder().decode([CacheMetadata].self, from: data) else {
            return []
        }
        return list
    }

    private func updateMetadata(_ metadata: CacheMetadata, forKey key: String) throws {
        var list = getMetadataList()
        list.removeAll { $0.key == key }

        var updatedMetadata = metadata
        updatedMetadata.lastAccessedAt = Date()
        list.append(updatedMetadata)

        let data = try JSONEncoder().encode(list)
        try data.write(to: metadataURL, options: .atomic)
    }

    private func removeMetadata(forKey key: String) {
        var list = getMetadataList()
        list.removeAll { $0.key == key }

        if let data = try? JSONEncoder().encode(list) {
            try? data.write(to: metadataURL, options: .atomic)
        }
    }

    private func clearMetadata() {
        try? fileManager.removeItem(at: metadataURL)
    }
}

struct CacheMetadata: Codable {
    let key: String
    let createdAt: Date
    var expiresAt: Date?
    var size: Int
    var lastAccessedAt: Date?
}

struct CacheWrapper: Codable {
    let data: Data
    let metadata: CacheMetadata
}
