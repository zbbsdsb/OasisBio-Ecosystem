import SwiftUI

struct SettingsView: View {
    @StateObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) private var colorScheme
    
    @State private var notificationsEnabled = true
    @State private var darkModeEnabled = false
    
    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink {
                        EmptyView()
                    } label: {
                        HStack {
                            Image(systemName: "person.circle")
                                .font(.title2)
                                .foregroundColor(.accentColor)
                            Text("账户")
                        }
                    }
                }
                
                Section {
                    Toggle(isOn: $notificationsEnabled) {
                        HStack {
                            Image(systemName: "bell.circle")
                                .font(.title2)
                                .foregroundColor(.accentColor)
                            Text("通知")
                        }
                    }
                    
                    Toggle(isOn: $darkModeEnabled) {
                        HStack {
                            Image(systemName: "paintpalette")
                                .font(.title2)
                                .foregroundColor(.accentColor)
                            Text("深色模式")
                        }
                    }
                }
                
                Section {
                    NavigationLink {
                        EmptyView()
                    } label: {
                        HStack {
                            Image(systemName: "lock.circle")
                                .font(.title2)
                                .foregroundColor(.accentColor)
                            Text("隐私和安全")
                        }
                    }
                    
                    NavigationLink {
                        EmptyView()
                    } label: {
                        HStack {
                            Image(systemName: "info.circle")
                                .font(.title2)
                                .foregroundColor(.accentColor)
                            Text("关于")
                        }
                    }
                }
            }
            .navigationTitle("设置")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("退出登录") {
                        authViewModel.signOut()
                    }
                    .foregroundColor(.red)
                }
            }
            .onAppear {
                darkModeEnabled = colorScheme == .dark
            }
            .onChange(of: darkModeEnabled) { _, newValue in
                withAnimation(.easeInOut(duration: 0.3)) {
                    if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                       let window = windowScene.windows.first {
                        window.overrideUserInterfaceStyle = newValue ? .dark : .light
                    }
                }
            }
        }
    }
}
