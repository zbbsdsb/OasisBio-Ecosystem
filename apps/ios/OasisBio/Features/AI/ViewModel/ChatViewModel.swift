import Foundation
import Combine

final class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputMessage = ""
    @Published var isLoading = false
    @Published var error: String?
    @Published var selectedModel: AIModel = .deo
    @Published var availableModels: [AIModel] = [.deo, .dia]
    
    private let repository: AIRepositoryProtocol
    private var cancellables = Set<AnyCancellable>()
    
    init(repository: AIRepositoryProtocol = AIRepository()) {
        self.repository = repository
        setupBindings()
    }
    
    private func setupBindings() {
        $selectedModel
            .sink { [weak self] _ in
                self?.loadMessages()
            }
            .store(in: &cancellables)
    }
    
    func sendMessage() async {
        guard !inputMessage.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        isLoading = true
        error = nil
        
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: inputMessage,
            createdAt: Date()
        )
        messages.append(userMessage)
        let messageToSend = inputMessage
        inputMessage = ""
        
        do {
            let response = try await repository.sendMessage(
                message: messageToSend,
                model: selectedModel
            )
            
            if let choice = response.choices.first {
                messages.append(choice.message)
            }
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func loadMessages() async {
        isLoading = true
        error = nil
        
        do {
            availableModels = try await repository.getModels()
        } catch let err {
            self.error = err.localizedDescription
        }
        
        isLoading = false
    }
    
    func clearChat() {
        messages.removeAll()
    }
}