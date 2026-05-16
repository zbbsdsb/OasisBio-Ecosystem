import SwiftUI

struct ChatView: View {
    @StateObject var viewModel: ChatViewModel
    
    init(viewModel: ChatViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    var body: some View {
        NavigationStack {
            VStack {
                modelSelector
                messagesList
                inputArea
            }
            .navigationTitle("AI Assistant")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Clear") {
                        viewModel.clearChat()
                    }
                }
            }
            .onAppear {
                Task { await viewModel.loadMessages() }
            }
        }
    }
    
    private var modelSelector: some View {
        HStack {
            Text("Model:")
            Picker("Select Model", selection: $viewModel.selectedModel) {
                ForEach(viewModel.availableModels, id: \.self) { model in
                    Text(model.displayName).tag(model)
                }
            }
            .pickerStyle(.segmented)
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private var messagesList: some View {
        List(viewModel.messages) { message in
            MessageView(message: message)
        }
        .listStyle(.plain)
        .overlay {
            if viewModel.messages.isEmpty {
                VStack {
                    Image(systemName: "message.circle")
                        .font(.system(size: 64))
                        .foregroundColor(.secondary)
                    Text("Start a conversation with \(viewModel.selectedModel.displayName)")
                        .foregroundColor(.secondary)
                }
            }
        }
        .overlay {
            if viewModel.isLoading {
                ProgressView()
            }
        }
    }
    
    private var inputArea: some View {
        HStack {
            TextField("Type a message...", text: $viewModel.inputMessage)
                .textFieldStyle(.roundedBorder)
            
            Button(action: {
                Task { await viewModel.sendMessage() }
            }) {
                Image(systemName: "paperplane")
                    .padding()
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .clipShape(Circle())
            }
            .disabled(viewModel.inputMessage.trimmingCharacters(in: .whitespaces).isEmpty || viewModel.isLoading)
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct MessageView: View {
    let message: ChatMessage
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            avatar
            
            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                Text(message.role == .user ? "You" : message.role.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(message.content)
                    .padding(12)
                    .background(message.role == .user ? Color.accentColor : Color(.systemGray5))
                    .foregroundColor(message.role == .user ? .white : .primary)
                    .cornerRadius(16)
                    .overlay(alignment: message.role == .user ? .bottomTrailing : .bottomLeading) {
                        Text(formattedDate(message.createdAt))
                            .font(.caption2)
                            .foregroundColor(message.role == .user ? .white.opacity(0.7) : .secondary)
                            .padding(4)
                    }
            }
        }
        .listRowSeparator(.hidden)
    }
    
    private var avatar: some View {
        Circle()
            .fill(message.role == .user ? Color.accentColor : Color(.systemGray4))
            .frame(width: 40, height: 40)
            .overlay {
                Image(systemName: message.role == .user ? "person" : "cpu")
                    .foregroundColor(message.role == .user ? .white : .primary)
                    .font(.headline)
            }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}