import SwiftUI

struct IdentityFormView: View {
    @ObservedObject var viewModel: IdentityViewModel
    @State private var name = ""
    @State private var description = ""
    @State private var selectedType = IdentityType.personal
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                TextField("名称", text: $name)
                    .textFieldStyle(.roundedBorder)
                    .padding()
                
                TextField("描述（可选）", text: $description)
                    .textFieldStyle(.roundedBorder)
                    .padding()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("类型")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Picker("类型", selection: $selectedType) {
                        ForEach(IdentityType.allCases, id: \.self) { type in
                            Text(type.rawValue.capitalized).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding()
                
                Button(action: {
                    Task {
                        try await viewModel.saveIdentity(
                            name: name,
                            description: description.isEmpty ? nil : description,
                            type: selectedType
                        )
                    }
                }) {
                    Text(viewModel.isEditing ? "保存修改" : "创建身份")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                }
                .disabled(name.isEmpty)
                
                Spacer()
            }
            .padding()
            .navigationTitle(viewModel.isEditing ? "编辑身份" : "创建身份")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                if let identity = viewModel.selectedIdentity {
                    name = identity.name
                    description = identity.description ?? ""
                    selectedType = identity.type
                }
            }
        }
    }
}

extension IdentityType: CaseIterable {}
