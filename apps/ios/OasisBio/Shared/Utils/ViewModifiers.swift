import SwiftUI

struct LoadingOverlay: ViewModifier {
    let isLoading: Bool
    
    func body(content: Content) -> some View {
        content
            .overlay {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(.systemBackground).opacity(0.8))
                }
            }
    }
}

struct ErrorBanner: ViewModifier {
    let error: String?
    let onRetry: (() -> Void)?
    
    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                if let error = error {
                    VStack {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.red)
                            
                            Text(error)
                                .foregroundColor(.red)
                                .font(.body)
                            
                            Spacer()
                            
                            if let onRetry = onRetry {
                                Button("Retry") {
                                    onRetry()
                                }
                                .foregroundColor(.accentColor)
                            }
                            
                            Button {
                                // Dismiss error
                            } label: {
                                Image(systemName: "xmark")
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .border(Color.red, width: 1)
                        .cornerRadius(8)
                    }
                    .padding()
                }
            }
    }
}

extension View {
    func loadingOverlay(isLoading: Bool) -> some View {
        modifier(LoadingOverlay(isLoading: isLoading))
    }
    
    func errorBanner(error: String?, onRetry: (() -> Void)? = nil) -> some View {
        modifier(ErrorBanner(error: error, onRetry: onRetry))
    }
}