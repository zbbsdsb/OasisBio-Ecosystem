import Foundation
import Combine

final class AuthViewModel: ObservableObject {
    @Published var phone = ""
    @Published var otp = ""
    @Published var isLoading = false
    @Published var error: String?
    @Published var isOtpSent = false
    
    private let repository: AuthRepositoryProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(repository: AuthRepositoryProtocol) {
        self.repository = repository
    }
    
    func requestOtp() async {
        guard !phone.isEmpty else {
            error = "请输入手机号码"
            return
        }
        
        isLoading = true
        error = nil
        
        do {
            try await repository.requestOtp(phone: phone)
            isOtpSent = true
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func verifyOtp() async -> Bool {
        guard !otp.isEmpty else {
            error = "请输入验证码"
            return false
        }
        
        isLoading = true
        error = nil
        
        do {
            _ = try await repository.verifyOtp(phone: phone, otp: otp)
            return true
        } catch let err {
            self.error = err.localizedDescription
            return false
        } finally {
            isLoading = false
        }
    }
    
    func logout() {
        repository.logout()
        phone = ""
        otp = ""
        isOtpSent = false
    }
    
    func hasValidSession() -> Bool {
        repository.hasValidSession()
    }
}
