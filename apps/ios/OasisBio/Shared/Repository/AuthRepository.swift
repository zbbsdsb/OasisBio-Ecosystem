import Foundation

protocol AuthRepositoryProtocol {
    func requestOtp(phone: String) async throws
    func verifyOtp(phone: String, otp: String) async throws -> Session
    func loginWithOAuth(provider: OAuthProvider, token: String) async throws -> Session
    func logout()
    func hasValidSession() -> Bool
    func refreshTokenIfNeeded() async throws -> Session?
}

enum OAuthProvider: String {
    case apple
    case google
    case facebook
}

final class AuthRepository: AuthRepositoryProtocol {
    private let api = OasisBioAPI.shared
    private let authInterceptor = AuthInterceptor.shared
    
    func requestOtp(phone: String) async throws {
        _ = try await api.requestOtp(phone: phone)
    }
    
    func verifyOtp(phone: String, otp: String) async throws -> Session {
        let session = try await api.verifyOtp(phone: phone, otp: otp)
        authInterceptor.setSession(session)
        return session
    }
    
    func loginWithOAuth(provider: OAuthProvider, token: String) async throws -> Session {
        let session = try await api.loginWithOAuth(provider: provider, token: token)
        authInterceptor.setSession(session)
        return session
    }
    
    func logout() {
        authInterceptor.clearSession()
    }
    
    func hasValidSession() -> Bool {
        authInterceptor.hasValidSession()
    }
    
    func refreshTokenIfNeeded() async throws -> Session? {
        guard let refreshToken = authInterceptor.getRefreshToken() else {
            return nil
        }
        
        if authInterceptor.isTokenExpired() {
            let session = try await api.refreshToken(refreshToken: refreshToken)
            authInterceptor.setSession(session)
            return session
        }
        
        return nil
    }
}
