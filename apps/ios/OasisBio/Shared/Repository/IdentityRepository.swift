import Foundation

protocol IdentityRepositoryProtocol {
    func getIdentities(page: Int, limit: Int) async throws -> PaginatedIdentities
    func searchIdentities(query: String) async throws -> [OasisBioIdentity]
    func getIdentity(id: String) async throws -> OasisBioIdentity
    func createIdentity(_ identity: OasisBioIdentity) async throws -> OasisBioIdentity
    func updateIdentity(id: String, identity: OasisBioIdentity) async throws -> OasisBioIdentity
    func deleteIdentity(id: String) async throws
}

final class IdentityRepository: IdentityRepositoryProtocol {
    private let api = OasisBioAPI.shared
    
    func getIdentities(page: Int = 1, limit: Int = 20) async throws -> PaginatedIdentities {
        try await api.getIdentities(page: page, limit: limit)
    }
    
    func searchIdentities(query: String) async throws -> [OasisBioIdentity] {
        try await api.searchIdentities(query: query)
    }
    
    func getIdentity(id: String) async throws -> OasisBioIdentity {
        try await api.getIdentity(id: id)
    }
    
    func createIdentity(_ identity: OasisBioIdentity) async throws -> OasisBioIdentity {
        try await api.createIdentity(identity)
    }
    
    func updateIdentity(id: String, identity: OasisBioIdentity) async throws -> OasisBioIdentity {
        try await api.updateIdentity(id: id, identity: identity)
    }
    
    func deleteIdentity(id: String) async throws {
        try await api.deleteIdentity(id: id)
    }
}
