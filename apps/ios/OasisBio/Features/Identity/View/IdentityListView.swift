import SwiftUI

struct IdentityListView: View {
    @StateObject var viewModel: IdentityViewModel
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.identities) { identity in
                    IdentityRow(identity: identity)
                        .onTapGesture {
                            viewModel.selectIdentity(identity)
                        }
                }
                .onDelete { indexSet in
                    if let index = indexSet.first {
                        let identity = viewModel.identities[index]
                        Task {
                            await viewModel.deleteIdentity(id: identity.id)
                        }
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle("身份管理")
            .navigationBarItems(trailing: addButton)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        viewModel.createIdentity()
                    }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
            .onAppear {
                Task {
                    await viewModel.loadIdentities()
                }
            }
            .sheet(isPresented: $viewModel.isPresentingDetail) {
                if let identity = viewModel.selectedIdentity {
                    IdentityDetailView(
                        identity: identity,
                        onEdit: { viewModel.editIdentity(identity) }
                    )
                }
            }
            .sheet(isPresented: $viewModel.isPresentingForm) {
                IdentityFormView(viewModel: viewModel)
            }
        }
    }
    
    private var addButton: some View {
        Button(action: {
            viewModel.createIdentity()
        }) {
            Image(systemName: "plus")
        }
    }
}

struct IdentityRow: View {
    let identity: OasisBioIdentity
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: identityTypeIcon)
                .resizable()
                .frame(width: 40, height: 40)
                .foregroundColor(identityTypeColor)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(identity.name)
                    .font(.headline)
                
                Text(identity.type.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
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
}
