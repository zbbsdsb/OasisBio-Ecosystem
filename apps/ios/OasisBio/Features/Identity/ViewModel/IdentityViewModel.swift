import Foundation
import Combine

final class IdentityViewModel: ObservableObject {
    @Published var identities: [OasisBioIdentity] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var selectedIdentity: OasisBioIdentity?
    @Published var isPresentingDetail = false
    @Published var isPresentingForm = false
    @Published var isEditing = false
    @Published var searchQuery = ""
    @Published var currentPage = 1
    @Published var totalPages = 1
    @Published var hasMore = true
    
    private let repository: IdentityRepositoryProtocol
    private var cancellables = Set<AnyCancellable>()
    private var searchTask: Task<Void, Never>?
    
    init(repository: IdentityRepositoryProtocol) {
        self.repository = repository
        setupSearch()
    }
    
    private func setupSearch() {
        $searchQuery
            .debounce(for: .seconds(0.3), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .sink { [weak self] query in
                self?.searchTask?.cancel()
                self?.currentPage = 1
                if query.isEmpty {
                    Task { await self?.loadIdentities() }
                } else {
                    Task { await self?.searchIdentities(query: query) }
                }
            }
            .store(in: &cancellables)
    }
    
    func loadIdentities(page: Int = 1) async {
        isLoading = true
        error = nil
        
        do {
            let result = try await repository.getIdentities(page: page, limit: 20)
            if page == 1 {
                identities = result.data
            } else {
                identities.append(contentsOf: result.data)
            }
            currentPage = result.page
            totalPages = result.totalPages
            hasMore = result.page < result.totalPages
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func loadMore() async {
        guard hasMore && !isLoading else { return }
        await loadIdentities(page: currentPage + 1)
    }
    
    func searchIdentities(query: String) async {
        isLoading = true
        error = nil
        
        do {
            identities = try await repository.searchIdentities(query: query)
            hasMore = false
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func selectIdentity(_ identity: OasisBioIdentity) {
        selectedIdentity = identity
        isPresentingDetail = true
    }
    
    func createIdentity() {
        isEditing = false
        selectedIdentity = nil
        isPresentingForm = true
    }
    
    func editIdentity(_ identity: OasisBioIdentity) {
        isEditing = true
        selectedIdentity = identity
        isPresentingForm = true
    }
    
    func saveIdentity(name: String, description: String?, type: IdentityType) async throws {
        if let existingIdentity = selectedIdentity, isEditing {
            var updated = existingIdentity
            updated.name = name
            updated.description = description
            updated.type = type
            _ = try await repository.updateIdentity(id: existingIdentity.id, identity: updated)
        } else {
            let newIdentity = OasisBioIdentity(
                id: UUID().uuidString,
                name: name,
                description: description,
                type: type,
                status: .active,
                metadata: nil,
                createdAt: Date(),
                updatedAt: Date()
            )
            _ = try await repository.createIdentity(newIdentity)
        }
        
        isPresentingForm = false
        searchQuery = ""
        await loadIdentities()
    }
    
    func deleteIdentity(id: String) async {
        do {
            try await repository.deleteIdentity(id: id)
            searchQuery = ""
            await loadIdentities()
        } catch let err {
            self.error = err.localizedDescription
        }
    }
}
