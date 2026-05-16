import Foundation

protocol AbilityRepositoryProtocol {
    func getAbilities(page: Int, limit: Int) async throws -> PaginatedAbilities
    func searchAbilities(query: String) async throws -> [OasisBioAbility]
    func getAbility(id: String) async throws -> OasisBioAbility
    func createAbility(_ ability: OasisBioAbility) async throws -> OasisBioAbility
    func updateAbility(id: String, ability: OasisBioAbility) async throws -> OasisBioAbility
    func deleteAbility(id: String) async throws
}

final class AbilityRepository: AbilityRepositoryProtocol {
    private let api = OasisBioAPI.shared
    
    func getAbilities(page: Int = 1, limit: Int = 20) async throws -> PaginatedAbilities {
        let mockAbilities = generateMockAbilities()
        
        let startIndex = (page - 1) * limit
        let endIndex = min(startIndex + limit, mockAbilities.count)
        
        guard startIndex < mockAbilities.count else {
            return PaginatedAbilities(
                data: [],
                page: page,
                totalPages: 1,
                totalCount: mockAbilities.count
            )
        }
        
        let pageData = Array(mockAbilities[startIndex..<endIndex])
        let totalPages = Int(ceil(Double(mockAbilities.count) / Double(limit)))
        
        return PaginatedAbilities(
            data: pageData,
            page: page,
            totalPages: totalPages,
            totalCount: mockAbilities.count
        )
    }
    
    func searchAbilities(query: String) async throws -> [OasisBioAbility] {
        let mockAbilities = generateMockAbilities()
        return mockAbilities.filter { ability in
            ability.name.localizedCaseInsensitiveContains(query) ||
            (ability.description?.localizedCaseInsensitiveContains(query) ?? false)
        }
    }
    
    func getAbility(id: String) async throws -> OasisBioAbility {
        let mockAbilities = generateMockAbilities()
        guard let ability = mockAbilities.first(where: { $0.id == id }) else {
            throw NSError(domain: "AbilityRepository", code: 404, userInfo: [NSLocalizedDescriptionKey: "Ability not found"])
        }
        return ability
    }
    
    func createAbility(_ ability: OasisBioAbility) async throws -> OasisBioAbility {
        return ability
    }
    
    func updateAbility(id: String, ability: OasisBioAbility) async throws -> OasisBioAbility {
        return ability
    }
    
    func deleteAbility(id: String) async throws {
    }
    
    private func generateMockAbilities() -> [OasisBioAbility] {
        return [
            OasisBioAbility(
                id: "1",
                name: "火焰操控",
                description: "控制和召唤火焰",
                type: .elemental,
                usageCount: 156,
                isActive: true,
                metadata: ["level": "advanced", "mana_cost": "high"],
                createdAt: Date().addingTimeInterval(-86400 * 30),
                updatedAt: Date().addingTimeInterval(-86400 * 5)
            ),
            OasisBioAbility(
                id: "2",
                name: "瞬间移动",
                description: "在空间中快速移动",
                type: .spatial,
                usageCount: 89,
                isActive: true,
                metadata: ["level": "expert", "mana_cost": "very_high"],
                createdAt: Date().addingTimeInterval(-86400 * 60),
                updatedAt: Date().addingTimeInterval(-86400 * 10)
            ),
            OasisBioAbility(
                id: "3",
                name: "心灵感应",
                description: "读取和传递思想",
                type: .mental,
                usageCount: 234,
                isActive: true,
                metadata: ["level": "master", "mana_cost": "medium"],
                createdAt: Date().addingTimeInterval(-86400 * 90),
                updatedAt: Date().addingTimeInterval(-86400 * 15)
            ),
            OasisBioAbility(
                id: "4",
                name: "时间暂停",
                description: "短暂停止时间流动",
                type: .temporal,
                usageCount: 45,
                isActive: true,
                metadata: ["level": "legendary", "mana_cost": "extreme"],
                createdAt: Date().addingTimeInterval(-86400 * 120),
                updatedAt: Date().addingTimeInterval(-86400 * 30)
            ),
            OasisBioAbility(
                id: "5",
                name: "冰霜之墙",
                description: "创造冰霜屏障进行防御",
                type: .defensive,
                usageCount: 312,
                isActive: true,
                metadata: ["level": "intermediate", "mana_cost": "medium"],
                createdAt: Date().addingTimeInterval(-86400 * 45),
                updatedAt: Date().addingTimeInterval(-86400 * 7)
            ),
            OasisBioAbility(
                id: "6",
                name: "雷电冲击",
                description: "释放强大的雷电攻击",
                type: .offensive,
                usageCount: 178,
                isActive: true,
                metadata: ["level": "advanced", "mana_cost": "high"],
                createdAt: Date().addingTimeInterval(-86400 * 75),
                updatedAt: Date().addingTimeInterval(-86400 * 12)
            ),
            OasisBioAbility(
                id: "7",
                name: "治疗光环",
                description: "为周围单位恢复生命",
                type: .support,
                usageCount: 445,
                isActive: true,
                metadata: ["level": "intermediate", "mana_cost": "low"],
                createdAt: Date().addingTimeInterval(-86400 * 100),
                updatedAt: Date().addingTimeInterval(-86400 * 3)
            ),
            OasisBioAbility(
                id: "8",
                name: "隐形术",
                description: "使自身或目标不可见",
                type: .utility,
                usageCount: 267,
                isActive: false,
                metadata: ["level": "advanced", "mana_cost": "medium"],
                createdAt: Date().addingTimeInterval(-86400 * 55),
                updatedAt: Date().addingTimeInterval(-86400 * 20)
            )
        ]
    }
}
