import Foundation

final class DependencyContainer {
    static let shared = DependencyContainer()

    private let authRepository: AuthRepositoryProtocol
    private let identityRepository: IdentityRepositoryProtocol
    private let aiRepository: AIRepositoryProtocol
    private let worldRepository: WorldRepositoryProtocol

    private let cacheManager: CacheManager
    private let memoryMonitor: MemoryMonitor
    private let optimizedDefaults: OptimizedUserDefaults
    private let cachedKeychainManager: CachedKeychainManager

    private init() {
        self.authRepository = AuthRepository()
        self.identityRepository = IdentityRepository()
        self.aiRepository = AIRepository()
        self.worldRepository = WorldRepository()

        self.cacheManager = CacheManager.shared
        self.memoryMonitor = MemoryMonitor.shared
        self.optimizedDefaults = OptimizedUserDefaults.shared
        self.cachedKeychainManager = CachedKeychainManager.shared
    }

    func makeAuthViewModel() -> AuthViewModel {
        AuthViewModel(repository: authRepository)
    }

    func makeIdentityViewModel() -> IdentityViewModel {
        IdentityViewModel(repository: identityRepository)
    }

    func makeChatViewModel() -> ChatViewModel {
        ChatViewModel(repository: aiRepository)
    }

    func makeWorldViewModel() -> WorldViewModel {
        WorldViewModel(repository: worldRepository)
    }

    func getCacheManager() -> CacheManager {
        cacheManager
    }

    func getMemoryMonitor() -> MemoryMonitor {
        memoryMonitor
    }

    func getOptimizedDefaults() -> OptimizedUserDefaults {
        optimizedDefaults
    }

    func getCachedKeychainManager() -> CachedKeychainManager {
        cachedKeychainManager
    }
}
