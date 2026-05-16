import SwiftUI
import UIKit

actor ImageCache {
    static let shared = ImageCache()

    private let cache = NSCache<NSString, UIImage>()
    private var diskCacheURL: URL?

    private init() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024

        if let cacheDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first {
            diskCacheURL = cacheDirectory.appendingPathComponent("ImageCache", isDirectory: true)
            try? FileManager.default.createDirectory(at: diskCacheURL!, withIntermediateDirectories: true)
        }
    }

    func image(for url: URL) async -> UIImage? {
        let key = url.absoluteString as NSString

        if let cached = cache.object(forKey: key) {
            return cached
        }

        if let diskImage = await loadFromDisk(url: url) {
            cache.setObject(diskImage, forKey: key)
            return diskImage
        }

        return nil
    }

    func store(_ image: UIImage, for url: URL) async {
        let key = url.absoluteString as NSString
        cache.setObject(image, forKey: key)

        await saveToDisk(image: image, url: url)
    }

    private func loadFromDisk(url: URL) async -> UIImage? {
        guard let diskURL = diskCacheURL else { return nil }

        let fileURL = diskURL.appendingPathComponent(url.absoluteString.hash.description)

        guard let data = try? Data(contentsOf: fileURL),
              let image = UIImage(data: data) else {
            return nil
        }

        return image
    }

    private func saveToDisk(image: UIImage, url: URL) async {
        guard let diskURL = diskCacheURL,
              let data = image.jpegData(compressionQuality: 0.8) else { return }

        let fileURL = diskURL.appendingPathComponent(url.absoluteString.hash.description)
        try? data.write(to: fileURL)
    }

    func clearCache() async {
        cache.removeAllObjects()

        if let diskURL = diskCacheURL {
            try? FileManager.default.removeItem(at: diskURL)
            try? FileManager.default.createDirectory(at: diskURL, withIntermediateDirectories: true)
        }
    }
}

struct ImageCacheConfig {
    let memoryCacheCountLimit: Int
    let memoryCacheTotalCostLimit: Int
    let diskCacheEnabled: Bool

    static let `default` = ImageCacheConfig(
        memoryCacheCountLimit: 100,
        memoryCacheTotalCostLimit: 50 * 1024 * 1024,
        diskCacheEnabled: true
    )

    static let aggressive = ImageCacheConfig(
        memoryCacheCountLimit: 200,
        memoryCacheTotalCostLimit: 100 * 1024 * 1024,
        diskCacheEnabled: true
    )
}

struct CachedAsyncImage<Placeholder: View, ErrorView: View>: View {
    let url: URL?
    let placeholder: () -> Placeholder
    let errorView: (Error) -> ErrorView
    let configuration: (Image) -> Image
    let cacheConfig: ImageCacheConfig

    @State private var phase: AsyncImagePhase = .empty

    init(
        url: URL?,
        cacheConfig: ImageCacheConfig = .default,
        @ViewBuilder placeholder: @escaping () -> Placeholder = { ProgressView() },
        @ViewBuilder errorView: @escaping (Error) -> ErrorView = { _ in Color.gray.opacity(0.3) },
        configuration: @escaping (Image) -> Image = { $0 }
    ) {
        self.url = url
        self.cacheConfig = cacheConfig
        self.placeholder = placeholder
        self.errorView = errorView
        self.configuration = configuration
    }

    var body: some View {
        Group {
            switch phase {
            case .empty:
                placeholder()
                    .onAppear {
                        loadImage()
                    }
            case .loading:
                placeholder()
            case .success(let image):
                configuration(Image(uiImage: image))
            case .failure(let error):
                errorView(error)
            @unknown default:
                placeholder()
            }
        }
        .equatable()
    }

    private func loadImage() {
        guard let url = url else {
            phase = .failure(AsyncImageError.invalidURL)
            return
        }

        Task {
            if let cachedImage = await ImageCache.shared.image(for: url) {
                await MainActor.run {
                    phase = .success(cachedImage)
                }
                return
            }

            do {
                let (data, response) = try await URLSession.shared.data(from: url)

                guard let httpResponse = response as? HTTPURLResponse,
                      (200...299).contains(httpResponse.statusCode) else {
                    throw AsyncImageError.invalidResponse
                }

                guard let image = UIImage(data: data) else {
                    throw AsyncImageError.decodingFailed
                }

                await ImageCache.shared.store(image, for: url)

                await MainActor.run {
                    phase = .success(image)
                }
            } catch {
                await MainActor.run {
                    phase = .failure(error)
                }
            }
        }
    }
}

enum AsyncImageError: LocalizedError {
    case invalidURL
    case invalidResponse
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid image URL"
        case .invalidResponse:
            return "Invalid server response"
        case .decodingFailed:
            return "Failed to decode image"
        }
    }
}

extension CachedAsyncImage where ErrorView == ImageLoadErrorView {
    init(
        url: URL?,
        cacheConfig: ImageCacheConfig = .default,
        @ViewBuilder placeholder: @escaping () -> Placeholder = { ProgressView() },
        configuration: @escaping (Image) -> Image = { $0 }
    ) {
        self.init(
            url: url,
            cacheConfig: cacheConfig,
            placeholder: placeholder,
            errorView: { ImageLoadErrorView(error: $0) },
            configuration: configuration
        )
    }
}

struct ImageLoadErrorView: View {
    let error: Error

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "photo")
                .font(.largeTitle)
                .foregroundColor(.gray)

            Text(error.localizedDescription)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.gray.opacity(0.1))
    }
}

struct ResizableCachedImage: View {
    let url: URL?
    let contentMode: ContentMode
    let cacheConfig: ImageCacheConfig

    init(
        url: URL?,
        contentMode: ContentMode = .fill,
        cacheConfig: ImageCacheConfig = .default
    ) {
        self.url = url
        self.contentMode = contentMode
        self.cacheConfig = cacheConfig
    }

    var body: some View {
        CachedAsyncImage(
            url: url,
            cacheConfig: cacheConfig,
            placeholder: {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .overlay {
                        ProgressView()
                    }
            },
            errorView: { _ in
                Rectangle()
                    .fill(Color.gray.opacity(0.1))
                    .overlay {
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    }
            },
            configuration: { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            }
        )
    }
}
