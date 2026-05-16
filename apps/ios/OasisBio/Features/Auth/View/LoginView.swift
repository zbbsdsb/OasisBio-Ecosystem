import SwiftUI

struct LoginView: View {
    @StateObject var viewModel: AuthViewModel
    let onLoginSuccess: () -> Void
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text("登录")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                VStack(spacing: 16) {
                    TextField("手机号码", text: $viewModel.phone)
                        .keyboardType(.phonePad)
                        .textFieldStyle(.roundedBorder)
                        .padding()
                    
                    if viewModel.isOtpSent {
                        NavigationLink {
                            OtpView(viewModel: viewModel, onLoginSuccess: onLoginSuccess)
                        } label: {
                            Text("输入验证码")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .cornerRadius(12)
                        }
                    } else {
                        Button(action: {
                            Task {
                                await viewModel.requestOtp()
                            }
                        }) {
                            Text(viewModel.isLoading ? "发送中..." : "获取验证码")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .cornerRadius(12)
                        }
                        .disabled(viewModel.isLoading || viewModel.phone.isEmpty)
                    }
                }
                
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Spacer()
            }
            .padding()
            .navigationTitle("登录")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
