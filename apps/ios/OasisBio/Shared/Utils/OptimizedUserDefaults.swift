import Foundation

final class OptimizedUserDefaults {
    static let shared = OptimizedUserDefaults()

    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private let memoryCache: NSCache<NSString, NSObject>
    private let logger: Logger
    private let lock = NSLock()
    private let suiteName: String

    private init(suiteName: String = "OasisBioDefaults") {
        self.suiteName = suiteName
        self.defaults = UserDefaults(suiteName: suiteName) ?? .standard
        self.memoryCache = NSCache<NSString, NSObject>()
        self.memoryCache.countLimit = 100
        self.logger = Logger(subsystem: "com.oasisbio.defaults", category: "optimized")
    }

    func set<T: Codable>(_ value: T, forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        do {
            let data = try encoder.encode(value)
            defaults.set(data, forKey: key)
            memoryCache.setObject(data as NSObject, forKey: key as NSString)
            logger.debug("Stored: \(key)")
        } catch {
            logger.error("Failed to encode value for key: \(key) - \(error.localizedDescription)")
        }
    }

    func get<T: Codable>(_ type: T.Type, forKey key: String) -> T? {
        lock.lock()
        defer { lock.unlock() }

        if let cached = memoryCache.object(forKey: key as NSString) as? Data,
           let value = try? decoder.decode(T.self, from: cached) {
            return value
        }

        guard let data = defaults.data(forKey: key) else {
            return nil
        }

        guard let value = try? decoder.decode(T.self, from: data) else {
            return nil
        }

        memoryCache.setObject(data as NSObject, forKey: key as NSString)
        return value
    }

    func setString(_ value: String, forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        defaults.set(value, forKey: key)
        memoryCache.setObject(value as NSString, forKey: key as NSString)
    }

    func getString(forKey key: String) -> String? {
        lock.lock()
        defer { lock.unlock() }

        if let cached = memoryCache.object(forKey: key as NSString) as? String {
            return cached
        }

        guard let value = defaults.string(forKey: key) else {
            return nil
        }

        memoryCache.setObject(value as NSString, forKey: key as NSString)
        return value
    }

    func setInt(_ value: Int, forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        defaults.set(value, forKey: key)
        memoryCache.setObject(NSNumber(value: value), forKey: key as NSString)
    }

    func getInt(forKey key: String) -> Int {
        lock.lock()
        defer { lock.unlock() }

        if let cached = memoryCache.object(forKey: key as NSString) as? NSNumber {
            return cached.intValue
        }

        let value = defaults.integer(forKey: key)
        memoryCache.setObject(NSNumber(value: value), forKey: key as NSString)
        return value
    }

    func setBool(_ value: Bool, forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        defaults.set(value, forKey: key)
        memoryCache.setObject(NSNumber(value: value), forKey: key as NSString)
    }

    func getBool(forKey key: String) -> Bool {
        lock.lock()
        defer { lock.unlock() }

        if let cached = memoryCache.object(forKey: key as NSString) as? NSNumber {
            return cached.boolValue
        }

        let value = defaults.bool(forKey: key)
        memoryCache.setObject(NSNumber(value: value), forKey: key as NSString)
        return value
    }

    func setDouble(_ value: Double, forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        defaults.set(value, forKey: key)
        memoryCache.setObject(NSNumber(value: value), forKey: key as NSString)
    }

    func getDouble(forKey key: String) -> Double {
        lock.lock()
        defer { lock.unlock() }

        if let cached = memoryCache.object(forKey: key as NSString) as? NSNumber {
            return cached.doubleValue
        }

        let value = defaults.double(forKey: key)
        memoryCache.setObject(NSNumber(value: value), forKey: key as NSString)
        return value
    }

    func setDate(_ value: Date, forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        defaults.set(value, forKey: key)
        memoryCache.setObject(value as NSDate, forKey: key as NSString)
    }

    func getDate(forKey key: String) -> Date? {
        lock.lock()
        defer { lock.unlock() }

        if let cached = memoryCache.object(forKey: key as NSString) as? Date {
            return cached
        }

        return defaults.object(forKey: key) as? Date
    }

    func remove(forKey key: String) {
        lock.lock()
        defer { lock.unlock() }

        defaults.removeObject(forKey: key)
        memoryCache.removeObject(forKey: key as NSString)
    }

    func clearMemoryCache() {
        lock.lock()
        defer { lock.unlock() }

        memoryCache.removeAllObjects()
        logger.info("Memory cache cleared")
    }

    func clearAll() {
        lock.lock()
        defer { lock.unlock() }

        if let bundleId = Bundle.main.bundleIdentifier {
            defaults.removePersistentDomain(forName: bundleId)
        }
        defaults.removePersistentDomain(forName: suiteName)
        memoryCache.removeAllObjects()
        logger.info("All UserDefaults cleared")
    }

    func contains(key: String) -> Bool {
        lock.lock()
        defer { lock.unlock() }

        return defaults.object(forKey: key) != nil
    }

    func synchronize() {
        defaults.synchronize()
    }

    func getAllKeys() -> [String] {
        return Array(defaults.dictionaryRepresentation().keys)
    }

    func getStorageSize() -> Int {
        var size = 0
        for key in getAllKeys() {
            if let data = defaults.data(forKey: key) {
                size += data.count
            }
        }
        return size
    }
}

extension OptimizedUserDefaults {
    func incrementInt(forKey key: String, by amount: Int = 1) -> Int {
        let current = getInt(forKey: key)
        let newValue = current + amount
        setInt(newValue, forKey: key)
        return newValue
    }

    func toggleBool(forKey key: String) -> Bool {
        let current = getBool(forKey: key)
        setBool(!current, forKey: key)
        return !current
    }
}

final class UserDefaultsBatchWriter {
    private let defaults: OptimizedUserDefaults
    private var pendingWrites: [(key: String, value: Any)] = []
    private let lock = NSLock()
    private let batchSize: Int
    private let flushInterval: TimeInterval
    private var flushTimer: Timer?

    init(defaults: OptimizedUserDefaults = .shared, batchSize: Int = 50, flushInterval: TimeInterval = 1.0) {
        self.defaults = defaults
        self.batchSize = batchSize
        self.flushInterval = flushInterval
        startFlushTimer()
    }

    private func startFlushTimer() {
        flushTimer = Timer.scheduledTimer(withTimeInterval: flushInterval, repeats: true) { [weak self] _ in
            self?.flush()
        }
    }

    func queueWrite<T: Codable>(value: T, forKey key: String) {
        lock.lock()
        pendingWrites.append((key, value))
        let shouldFlush = pendingWrites.count >= batchSize
        lock.unlock()

        if shouldFlush {
            flush()
        }
    }

    func flush() {
        lock.lock()
        let writes = pendingWrites
        pendingWrites.removeAll()
        lock.unlock()

        for (key, value) in writes {
            if let stringValue = value as? String {
                defaults.setString(stringValue, forKey: key)
            } else if let intValue = value as? Int {
                defaults.setInt(intValue, forKey: key)
            } else if let boolValue = value as? Bool {
                defaults.setBool(boolValue, forKey: key)
            } else if let data = value as? Data,
                      let codableValue = try? JSONDecoder().decode(AnyCodable.self, from: data) {
                switch codableValue.value {
                case .string(let s): defaults.setString(s, forKey: key)
                case .int(let i): defaults.setInt(i, forKey: key)
                case .bool(let b): defaults.setBool(b, forKey: key)
                default: break
                }
            }
        }
    }

    deinit {
        flushTimer?.invalidate()
        flush()
    }
}

enum AnyCodable: Codable {
    case string(String)
    case int(Int)
    case bool(Bool)
    case double(Double)
    case data(Data)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let stringValue = try? container.decode(String.self) {
            self = .string(stringValue)
        } else if let intValue = try? container.decode(Int.self) {
            self = .int(intValue)
        } else if let boolValue = try? container.decode(Bool.self) {
            self = .bool(boolValue)
        } else if let doubleValue = try? container.decode(Double.self) {
            self = .double(doubleValue)
        } else if let dataValue = try? container.decode(Data.self) {
            self = .data(dataValue)
        } else {
            throw DecodingError.typeMismatch(AnyCodable.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unsupported type"))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .data(let value): try container.encode(value)
        }
    }

    var value: Any {
        switch self {
        case .string(let s): return s
        case .int(let i): return i
        case .bool(let b): return b
        case .double(let d): return d
        case .data(let d): return d
        }
    }
}
