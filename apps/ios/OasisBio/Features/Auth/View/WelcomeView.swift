import SwiftUI

struct WelcomeView: View {
    @StateObject var viewModel: AuthViewModel
    let onLoginSuccess: () -> Void
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                Spacer()
                
                VStack(spacing: 16) {
                    Image(systemName: "leaf.fill")
                        .resizable()
                        .frame(width: 80, height: 80)
                        .foregroundColor(.green)
                    
                    Text("OasisBio")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("智能身份管理平台")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                NavigationLink {
                    LoginView(viewModel: viewModel, onLoginSuccess: onLoginSuccess)
                } label: {
                    Text("开始使用")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                }
                
                Text("欢迎来到 OasisBio")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
    }
}
