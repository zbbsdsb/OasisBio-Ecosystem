import Foundation
import os.log

final class APIClient: @unchecked Sendable {
    static let shared = APIClient()

    private let session: URLSession
    private let baseURL: URL
    private let logger: Logger
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private var requestDeduplication: RequestDeduplication
    private let deduplicationLock = NSLock()
    private var activeTasks: [UUID: Task<Void, Error>] = [:]
    private let taskLock = NSLock()

    struct Configuration {
        var timeoutInterval: TimeInterval = 30
        var resourceTimeoutInterval: TimeInterval = 60
        var requestCachePolicy: URLRequest.CachePolicy = .returnCacheDataElseLoad
        var cacheSize: Int = 50 * 1024 * 1024
        var deduplicationEnabled: Bool = true
        var deduplicationTimeout: TimeInterval = 5.0
        var maxConcurrentRequests: Int = 10
    }

    private var configuration: Configuration

    init(
        baseURL: URL = URL(string: "https://api.oasisbio.dev")!,
        configuration: Configuration = Configuration()
    ) {
        self.baseURL = baseURL
        self.configuration = configuration
        self.logger = Logger(subsystem: "com.oasisbio.api", category: "client")
        self.requestDeduplication = RequestDeduplication()

        let sessionConfiguration = URLSessionConfiguration.default
        sessionConfiguration.timeoutIntervalForRequest = configuration.timeoutInterval
        sessionConfiguration.timeoutIntervalForResource = configuration.resourceTimeoutInterval
        sessionConfiguration.requestCachePolicy = configuration.requestCachePolicy
        sessionConfiguration.urlCache = URLCache(
            memoryCapacity: configuration.cacheSize / 4,
            diskCapacity: configuration.cacheSize,
            diskPath: "oasisbio_api_cache"
        )
        sessionConfiguration.httpMaximumConnectionsPerHost = configuration.maxConcurrentRequests
        sessionConfiguration.waitsForConnectivity = true

        self.session = URLSession(configuration: sessionConfiguration)

        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dataDecodingStrategy = .base64Decoded

        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase

        logger.info("APIClient initialized with baseURL: \(baseURL.absoluteString)")
    }

    func updateConfiguration(_ newConfiguration: Configuration) {
        self.configuration = newConfiguration
        logger.info("Configuration updated: deduplication=\(newConfiguration.deduplicationEnabled)")
    }

    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        headers: [String: String] = [:],
        body: Data? = nil,
        taskId: UUID? = nil
    ) async throws -> T {
        let requestId = taskId ?? UUID()
        let metricId = await PerformanceMonitor.shared.startTracking(
            name: "\(method.rawValue) \(endpoint)",
            category: .api,
            metadata: [
                "endpoint": endpoint,
                "method": method.rawValue,
                "requestId": requestId.uuidString
            ]
        )

        defer {
            Task {
                _ = await PerformanceMonitor.shared.stopTracking(id: metricId)
            }
        }

        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.allHTTPHeaderFields = headers
        request.httpBody = body
        request.cachePolicy = method == .get ? configuration.requestCachePolicy : .reloadIgnoringLocalCacheData

        if configuration.deduplicationEnabled {
            if let cachedResult: T = await deduplicateRequest(request) {
                logger.debug("Request deduplicated: \(endpoint)")
                return cachedResult
            }
        }

        do {
            let startTime = CFAbsoluteTimeGetCurrent()
            let (data, response) = try await session.data(for: request)
            let duration = CFAbsoluteTimeGetCurrent() - startTime

            logger.debug("Request completed: \(endpoint) in \(String(format: "%.3f", duration))s")

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            try validateResponse(httpResponse)

            let decoded: T = try decodeWithPerformance(data: data, type: T.self, requestId: requestId)

            if configuration.deduplicationEnabled {
                await cacheDeduplicationResult(request: request, result: decoded)
            }

            return decoded
        } catch {
            logger.error("Request failed: \(endpoint) - \(error.localizedDescription)")
            throw mapError(error)
        }
    }

    func requestWithProgress<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        headers: [String: String] = [:],
        body: Data? = nil,
        progressHandler: ((Double) -> Void)? = nil
    ) async throws -> T {
        let requestId = UUID()

        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.allHTTPHeaderFields = headers
        request.httpBody = body
        request.timeoutInterval = configuration.timeoutInterval

        let (asyncBytes, response) = try await session.bytes(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        try validateResponse(httpResponse)

        let expectedLength = httpResponse.expectedContentLength
        var receivedData = Data()
        receivedData.reserveCapacity(Int(expectedLength > 0 ? expectedLength : 1024 * 1024))

        var downloadedBytes: Int64 = 0

        for try await byte in asyncBytes {
            receivedData.append(byte)
            downloadedBytes += 1

            if expectedLength > 0 && downloadedBytes % 65536 == 0 {
                let progress = Double(downloadedBytes) / Double(expectedLength)
                progressHandler?(min(progress, 1.0))
            }
        }

        progressHandler?(1.0)

        return try decodeWithPerformance(data: receivedData, type: T.self, requestId: requestId)
    }

    func cancelRequest(id: UUID) {
        taskLock.lock()
        defer { taskLock.unlock() }

        if let task = activeTasks[id] {
            task.cancel()
            activeTasks.removeValue(forKey: id)
            logger.info("Request cancelled: \(id.uuidString.prefix(8))")
        }
    }

    func cancelAllRequests() {
        taskLock.lock()
        defer { taskLock.unlock() }

        for (_, task) in activeTasks {
            task.cancel()
        }
        activeTasks.removeAll()
        logger.info("All requests cancelled")
    }

    func clearCache() {
        session.configuration.urlCache?.removeAllCachedResponses()
        logger.info("Cache cleared")
    }

    func getCachedResponse(for endpoint: String, method: HTTPMethod) -> CachedURLResponse? {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else { return nil }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue

        return session.configuration.urlCache?.cachedResponse(for: request)
    }

    private func deduplicateRequest<T: Decodable>(_ request: URLRequest) async -> T? {
        deduplicationLock.lock()
        let requestHash = generateRequestHash(request)

        if let existingWaiter = requestDeduplication.getExistingWaiter(for: requestHash) {
            deduplicationLock.unlock()
            logger.debug("Waiting for existing request: \(requestHash.prefix(8))")
            do {
                let result: T = try await existingWaiter.value
                return result
            } catch {
                return nil
            }
        }

        let waiter = RequestWaiter<T>()
        requestDeduplication.addWaiter(waiter, for: requestHash)
        deduplicationLock.unlock()

        return nil
    }

    private func cacheDeduplicationResult<T: Decodable>(request: URLRequest, result: T) async {
        deduplicationLock.lock()
        defer { deduplicationLock.unlock() }

        let requestHash = generateRequestHash(request)
        requestDeduplication.completeWaiter(for: requestHash, with: result)

        Task {
            try? await Task.sleep(nanoseconds: UInt64(configuration.deduplicationTimeout * 1_000_000_000))
            deduplicationLock.lock()
            requestDeduplication.removeWaiter(for: requestHash)
            deduplicationLock.unlock()
        }
    }

    private func generateRequestHash(_ request: URLRequest) -> String {
        var components: [String] = []
        components.append(request.httpMethod ?? "GET")
        components.append(request.url?.absoluteString ?? "")
        components.append(request.httpBody?.base64EncodedString() ?? "")
        return components.joined(separator: "|").data(using: .utf8)!.base64EncodedString()
    }

    private func validateResponse(_ response: HTTPURLResponse) throws {
        switch response.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        case 500...599:
            throw APIError.serverError
        default:
            throw APIError.httpError(statusCode: response.statusCode)
        }
    }

    private func decodeWithPerformance<T: Decodable>(data: Data, type: T.Type, requestId: UUID) throws -> T {
        let startTime = CFAbsoluteTimeGetCurrent()

        do {
            let result = try decoder.decode(type, from: data)
            let duration = CFAbsoluteTimeGetCurrent() - startTime

            if duration > 0.1 {
                logger.warning("Slow decode detected: \(duration)s for \(String(describing: type))")
            }

            return result
        } catch let decodingError as DecodingError {
            logger.error("Decoding error: \(String(describing: decodingError))")
            throw APIError.decodingError(decodingError)
        }
    }

    private func mapError(_ error: Error) -> APIError {
        if let apiError = error as? APIError {
            return apiError
        }

        if let urlError = error as? URLError {
            switch urlError.code {
            case .timedOut:
                return .httpError(statusCode: 408)
            case .notConnectedToInternet, .networkConnectionLost:
                return .networkError(urlError)
            case .cancelled:
                return .networkError(urlError)
            default:
                return .networkError(urlError)
            }
        }

        return .unknown
    }
}

final class RequestWaiter<T>: @unchecked Sendable {
    private var continuation: CheckedContinuation<T, Error>?
    private let lock = NSLock()

    func setContinuation(_ continuation: CheckedContinuation<T, Error>) {
        lock.lock()
        defer { lock.unlock() }
        self.continuation = continuation
    }

    func getContinuation() -> CheckedContinuation<T, Error>? {
        lock.lock()
        defer { lock.unlock() }
        return continuation
    }

    var value: T {
        get async throws {
            return try await withCheckedThrowingContinuation { [weak self] continuation in
                self?.lock.lock()
                if let existing = self?.continuation {
                    self?.lock.unlock()
                    existing.resume(returning: continuation as! T)
                } else {
                    self?.continuation = continuation as? CheckedContinuation<T, Error>
                    self?.lock.unlock()
                }
            }
        }
    }

    func resume(with result: T) {
        lock.lock()
        let cont = continuation
        continuation = nil
        lock.unlock()
        cont?.resume(returning: result)
    }
}

final class RequestDeduplication: @unchecked Sendable {
    private var waiters: [String: Any] = [:]
    private var results: [String: Any] = [:]
    private let lock = NSLock()

    func addWaiter<T>(_ waiter: RequestWaiter<T>, for key: String) {
        lock.lock()
        defer { lock.unlock() }
        waiters[key] = waiter
    }

    func getExistingWaiter<T>(for key: String) -> RequestWaiter<T>? {
        lock.lock()
        defer { lock.unlock() }
        return waiters[key] as? RequestWaiter<T>
    }

    func completeWaiter<T>(for key: String, with result: T) {
        lock.lock()
        defer { lock.unlock() }
        if let waiter = waiters.removeValue(forKey: key) as? RequestWaiter<T> {
            waiter.resume(with: result)
        }
        results[key] = result
    }

    func removeWaiter(for key: String) {
        lock.lock()
        defer { lock.unlock() }
        waiters.removeValue(forKey: key)
        results.removeValue(forKey: key)
    }

    func clear() {
        lock.lock()
        defer { lock.unlock() }
        waiters.removeAll()
        results.removeAll()
    }
}

enum HTTPMethod: String, Sendable {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
    case head = "HEAD"
}
