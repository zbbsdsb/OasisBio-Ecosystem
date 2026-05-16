import SwiftUI

struct OtpView: View {
    @StateObject var viewModel: AuthViewModel
    let onLoginSuccess: () -> Void
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text("验证码")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                Text("验证码已发送至 \(viewModel.phone)")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                TextField("请输入6位验证码", text: $viewModel.otp)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)
                    .padding()
                    .onChange(of: viewModel.otp) { newValue in
                        if newValue.count == 6 {
                            Task {
                                await verifyOtp()
                            }
                        }
                    }
                
                Button(action: {
                    Task {
                        await verifyOtp()
                    }
                }) {
                    Text(viewModel.isLoading ? "验证中..." : "验证登录")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                }
                .disabled(viewModel.isLoading || viewModel.otp.count < 6)
                
                Button(action: {
                    viewModel.isOtpSent = false
                    viewModel.otp = ""
                }) {
                    Text("重新获取验证码")
                        .foregroundColor(.green)
                }
                
                if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Spacer()
            }
            .padding()
            .navigationTitle("验证")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func verifyOtp() async {
        let success = await viewModel.verifyOtp()
        if success {
            onLoginSuccess()
        }
    }
}
