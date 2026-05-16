import SwiftUI

struct IdentityDetailView: View {
    let identity: OasisBioIdentity
    let onEdit: () -> Void
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 16) {
                        Image(systemName: identityTypeIcon)
                            .resizable()
                            .frame(width: 80, height: 80)
                            .foregroundColor(identityTypeColor)
                        
                        Text(identity.name)
                            .font(.title)
                            .fontWeight(.bold)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    
                    VStack(alignment: .leading, spacing: 16) {
                        if let description = identity.description {
                            SectionView(title: "描述", content: description)
                        }
                        
                        SectionView(title: "类型", content: identity.type.rawValue.capitalized)
                        SectionView(title: "状态", content: statusText)
                        SectionView(title: "创建时间", content: formattedDate(identity.createdAt))
                        SectionView(title: "更新时间", content: formattedDate(identity.updatedAt))
                    }
                }
                .padding()
            }
            .navigationTitle("身份详情")
            .navigationBarItems(trailing: editButton)
        }
    }
    
    private var editButton: some View {
        Button(action: onEdit) {
            Text("编辑")
        }
    }
    
    private var identityTypeIcon: String {
        switch identity.type {
        case .personal: return "person"
        case .organization: return "building"
        case .device: return "iphone"
        case .service: return "cloud"
        }
    }
    
    private var identityTypeColor: Color {
        switch identity.type {
        case .personal: return .blue
        case .organization: return .purple
        case .device: return .green
        case .service: return .orange
        }
    }
    
    private var statusText: String {
        switch identity.status {
        case .active: return "活跃"
        case .inactive: return "非活跃"
        case .pending: return "待审核"
        case .revoked: return "已撤销"
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct SectionView: View {
    let title: String
    let content: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(content)
                .font(.body)
        }
    }
}
