import Foundation
import Combine

final class AbilityViewModel: ObservableObject {
    @Published var abilities: [OasisBioAbility] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var selectedAbility: OasisBioAbility?
    @Published var isPresentingDetail = false
    @Published var isPresentingForm = false
    @Published var isEditing = false
    @Published var searchQuery = ""
    @Published var currentPage = 1
    @Published var totalPages = 1
    @Published var hasMore = true
    @Published var selectedFilter: AbilityType?
    
    private let repository: AbilityRepositoryProtocol
    private var cancellables = Set<AnyCancellable>()
    private var searchTask: Task<Void, Never>?
    
    init(repository: AbilityRepositoryProtocol) {
        self.repository = repository
        setupSearch()
        setupFiltering()
    }
    
    private func setupSearch() {
        $searchQuery
            .debounce(for: .seconds(0.3), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .sink { [weak self] query in
                self?.searchTask?.cancel()
                self?.currentPage = 1
                if query.isEmpty {
                    Task { await self?.loadAbilities() }
                } else {
                    Task { await self?.searchAbilities(query: query) }
                }
            }
            .store(in: &cancellables)
    }
    
    private func setupFiltering() {
        $selectedFilter
            .dropFirst()
            .sink { [weak self] _ in
                self?.currentPage = 1
                Task { await self?.loadAbilities() }
            }
            .store(in: &cancellables)
    }
    
    func loadAbilities(page: Int = 1) async {
        isLoading = true
        error = nil
        
        do {
            let result = try await repository.getAbilities(page: page, limit: 20)
            if page == 1 {
                abilities = result.data
            } else {
                abilities.append(contentsOf: result.data)
            }
            currentPage = result.page
            totalPages = result.totalPages
            hasMore = result.page < result.totalPages
            
            applyFilter()
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    private func applyFilter() {
        if let filter = selectedFilter {
            Task {
                await loadAbilities()
            }
        }
    }
    
    func loadMore() async {
        guard hasMore && !isLoading else { return }
        await loadAbilities(page: currentPage + 1)
    }
    
    func searchAbilities(query: String) async {
        isLoading = true
        error = nil
        
        do {
            var results = try await repository.searchAbilities(query: query)
            if let filter = selectedFilter {
                results = results.filter { $0.type == filter }
            }
            abilities = results
            hasMore = false
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func filterByType(_ type: AbilityType?) {
        selectedFilter = type
    }
    
    func selectAbility(_ ability: OasisBioAbility) {
        selectedAbility = ability
        isPresentingDetail = true
    }
    
    func createAbility() {
        isEditing = false
        selectedAbility = nil
        isPresentingForm = true
    }
    
    func editAbility(_ ability: OasisBioAbility) {
        isEditing = true
        selectedAbility = ability
        isPresentingForm = true
    }
    
    func saveAbility(name: String, description: String?, type: AbilityType) async throws {
        if let existingAbility = selectedAbility, isEditing {
            let updated = OasisBioAbility(
                id: existingAbility.id,
                name: name,
                description: description,
                type: type,
                usageCount: existingAbility.usageCount,
                isActive: existingAbility.isActive,
                metadata: existingAbility.metadata,
                createdAt: existingAbility.createdAt,
                updatedAt: Date()
            )
            _ = try await repository.updateAbility(id: existingAbility.id, ability: updated)
        } else {
            let newAbility = OasisBioAbility(
                id: UUID().uuidString,
                name: name,
                description: description,
                type: type,
                usageCount: 0,
                isActive: true,
                metadata: nil,
                createdAt: Date(),
                updatedAt: Date()
            )
            _ = try await repository.createAbility(newAbility)
        }
        
        isPresentingForm = false
        searchQuery = ""
        selectedFilter = nil
        await loadAbilities()
    }
    
    func deleteAbility(id: String) async {
        do {
            try await repository.deleteAbility(id: id)
            searchQuery = ""
            selectedFilter = nil
            await loadAbilities()
        } catch let err {
            self.error = err.localizedDescription
        }
    }
    
    func toggleAbilityStatus(_ ability: OasisBioAbility) async {
        let updated = OasisBioAbility(
            id: ability.id,
            name: ability.name,
            description: ability.description,
            type: ability.type,
            usageCount: ability.usageCount,
            isActive: !ability.isActive,
            metadata: ability.metadata,
            createdAt: ability.createdAt,
            updatedAt: Date()
        )
        
        do {
            _ = try await repository.updateAbility(id: ability.id, ability: updated)
            await loadAbilities()
        } catch let err {
            self.error = err.localizedDescription
        }
    }
    
    var filteredAbilities: [OasisBioAbility] {
        guard let filter = selectedFilter else {
            return abilities
        }
        return abilities.filter { $0.type == filter }
    }
    
    var abilitiesByType: [AbilityType: [OasisBioAbility]] {
        Dictionary(grouping: abilities, by: { $0.type })
    }
}
