import SwiftUI

struct OAuthApp: Identifiable {
    let id: UUID
    let clientId: String
    let clientSecret: String
    var name: String
    var description: String
    var homepageUrl: String
    var redirectUris: [String]
    var logoUrl: String?
    let ownerUserId: String
    let createdAt: Date
    var updatedAt: Date
}

struct DeveloperAppsView: View {
    @State private var apps: [OAuthApp] = []
    @State private var isLoading = false
    @State private var showingCreateSheet = false
    @State private var editingApp: OAuthApp?
    @State private var copiedId: String?
    
    var body: some View {
        NavigationStack {
            Group {
                if apps.isEmpty {
                    EmptyAppsView(onCreateTapped: $showingCreateSheet)
                } else {
                    AppsListView(
                        apps: $apps,
                        editingApp: $editingApp,
                        copiedId: $copiedId
                    )
                }
            }
            .navigationTitle("开发者应用")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingCreateSheet = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreateSheet) {
                AppFormSheet(
                    app: nil,
                    onSave: { newApp in
                        apps.append(newApp)
                        showingCreateSheet = false
                    }
                )
            }
            .sheet(item: $editingApp) { app in
                AppFormSheet(
                    app: app,
                    onSave: { updatedApp in
                        if let index = apps.firstIndex(where: { $0.id == updatedApp.id }) {
                            apps[index] = updatedApp
                        }
                        editingApp = nil
                    }
                )
            }
        }
    }
}

struct EmptyAppsView: View {
    @Binding var onCreateTapped: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "app.badge.plus")
                .font(.system(size: 64))
                .foregroundColor(.blue)
            
            Text("暂无 OAuth 应用")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("创建您的第一个 OAuth 应用，为您的产品启用「使用 Oasis 登录」功能")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Button(action: { onCreateTapped = true }) {
                Label("创建第一个应用", systemImage: "plus.circle")
            }
            .buttonStyle(.borderedProminent)
        }
    }
}

struct AppsListView: View {
    @Binding var apps: [OAuthApp]
    @Binding var editingApp: OAuthApp?
    @Binding var copiedId: String?
    
    var body: some View {
        List {
            ForEach(apps) { app in
                AppRow(
                    app: app,
                    copiedId: $copiedId,
                    onEdit: { editingApp = app }
                )
            }
            .onDelete(perform: deleteApps)
        }
        .listStyle(.insetGrouped)
    }
    
    private func deleteApps(at offsets: IndexSet) {
        apps.remove(atOffsets: offsets)
    }
}

struct AppRow: View {
    let app: OAuthApp
    @Binding var copiedId: String?
    let onEdit: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(app.name)
                    .font(.headline)
                
                Spacer()
                
                Text("活跃")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
            }
            
            Text(app.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Client ID")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Button(action: copyClientId) {
                        Image(systemName: copiedId == "\(app.id)-clientId" ? "checkmark" : "doc.on.doc")
                            .font(.caption)
                    }
                    .buttonStyle(.plain)
                }
                
                Text(app.clientId)
                    .font(.system(.caption, design: .monospaced))
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Redirect URIs")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                ForEach(app.redirectUris.prefix(2), id: \.self) { uri in
                    Text(uri)
                        .font(.system(.caption2, design: .monospaced))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(.systemGray6))
                        .cornerRadius(4)
                }
                
                if app.redirectUris.count > 2 {
                    Text("+\(app.redirectUris.count - 2) 更多")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            HStack {
                Button(action: onEdit) {
                    Label("编辑", systemImage: "pencil")
                        .font(.subheadline)
                }
                .buttonStyle(.bordered)
                
                Spacer()
            }
        }
        .padding(.vertical, 8)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        .onLongPressGesture(minimumDuration: 0) {
            isPressed = true
        } onPressingChanged: { pressing in
            isPressed = pressing
        }
    }
    
    private func copyClientId() {
        UIPasteboard.general.string = app.clientId
        copiedId = "\(app.id)-clientId"
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            if copiedId == "\(app.id)-clientId" {
                copiedId = nil
            }
        }
    }
}

struct AppFormSheet: View {
    let app: OAuthApp?
    let onSave: (OAuthApp) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var description = ""
    @State private var homepageUrl = ""
    @State private var redirectUris = ""
    @State private var logoUrl = ""
    @State private var showingError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("应用名称", text: $name)
                        .textContentType(.name)
                    
                    TextField("描述", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                } header: {
                    Text("基本信息")
                }
                
                Section {
                    TextField("首页 URL", text: $homepageUrl)
                        .textContentType(.URL)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                    
                    TextField("Logo URL（可选）", text: $logoUrl)
                        .textContentType(.URL)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                } header: {
                    Text("链接")
                }
                
                Section {
                    TextField("Redirect URIs（每行一个）", text: $redirectUris, axis: .vertical)
                        .lineLimit(3...6)
                        .autocapitalization(.none)
                        .font(.system(.body, design: .monospaced))
                } header: {
                    Text("重定向 URIs")
                } footer: {
                    Text("每行输入一个 URI，例如：https://myapp.com/callback")
                }
                
                if showingError {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle(app == nil ? "创建应用" : "编辑应用")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        saveApp()
                    }
                    .disabled(name.isEmpty || description.isEmpty || homepageUrl.isEmpty || redirectUris.isEmpty)
                }
            }
            .onAppear {
                if let app = app {
                    name = app.name
                    description = app.description
                    homepageUrl = app.homepageUrl
                    redirectUris = app.redirectUris.joined(separator: "\n")
                    logoUrl = app.logoUrl ?? ""
                }
            }
        }
    }
    
    private func saveApp() {
        let uris = redirectUris
            .split(separator: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
        
        guard !name.isEmpty, !description.isEmpty, !homepageUrl.isEmpty, !uris.isEmpty else {
            errorMessage = "请填写所有必填字段"
            showingError = true
            return
        }
        
        let newApp = OAuthApp(
            id: app?.id ?? UUID(),
            clientId: app?.clientId ?? generateClientId(),
            clientSecret: app?.clientSecret ?? generateClientSecret(),
            name: name,
            description: description,
            homepageUrl: homepageUrl,
            redirectUris: uris,
            logoUrl: logoUrl.isEmpty ? nil : logoUrl,
            ownerUserId: "current-user",
            createdAt: app?.createdAt ?? Date(),
            updatedAt: Date()
        )
        
        onSave(newApp)
    }
    
    private func generateClientId() -> String {
        return UUID().uuidString
    }
    
    private func generateClientSecret() -> String {
        let bytes = (0..<32).map { _ in UInt8.random(in: 0...255) }
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
}
