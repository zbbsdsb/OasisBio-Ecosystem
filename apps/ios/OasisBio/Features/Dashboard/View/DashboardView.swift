import SwiftUI

struct DashboardView: View {
    @StateObject var identityViewModel: IdentityViewModel
    @StateObject var worldViewModel: WorldViewModel
    
    @State private var isLoading = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        StatCard(
                            title: "身份",
                            value: "\(identityViewModel.identities.count)",
                            icon: "person.circle",
                            color: .blue
                        )
                        .transition(.scale.combined(with: .opacity))
                        
                        StatCard(
                            title: "世界",
                            value: "\(worldViewModel.worlds.count)",
                            icon: "globe",
                            color: .green
                        )
                        .transition(.scale.combined(with: .opacity))
                        
                        StatCard(
                            title: "能力",
                            value: "34",
                            icon: "bolt.circle",
                            color: .purple
                        )
                        .transition(.scale.combined(with: .opacity))
                        
                        StatCard(
                            title: "活跃",
                            value: "8",
                            icon: "chart.line.uptrend.xyaxis",
                            color: .orange
                        )
                        .transition(.scale.combined(with: .opacity))
                    }
                    
                    HStack(spacing: 16) {
                        QuickActionCard(
                            title: "创建身份",
                            icon: "plus.circle",
                            color: .blue
                        )
                        .transition(.move(edge: .leading).combined(with: .opacity))
                        
                        QuickActionCard(
                            title: "创建世界",
                            icon: "plus.circle",
                            color: .green
                        )
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("最近活动")
                            .font(.title2)
                            .fontWeight(.bold)
                            .transition(.opacity)
                        
                        VStack(spacing: 12) {
                            ForEach(0..<3) { index in
                                ActivityRow(
                                    title: index == 0 ? "更新了身份 \"探险家\"" : 
                                           index == 1 ? "创建了新世界 \"未来之城\"" : "添加了新能力",
                                    time: index == 0 ? "1 小时前" : 
                                          index == 1 ? "2 小时前" : "3 小时前"
                                )
                                .transition(.move(edge: .bottom).combined(with: .opacity))
                                .animation(.easeOut(duration: 0.3).delay(Double(index) * 0.1), value: isLoading)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding()
            }
            .navigationTitle("仪表盘")
            .onAppear {
                withAnimation(.easeOut(duration: 0.5)) {
                    isLoading = true
                }
                Task {
                    await identityViewModel.loadIdentities()
                    await worldViewModel.loadWorlds()
                }
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    @State private var isPressed = false
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(color)
                .scaleEffect(isPressed ? 0.9 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        .onLongPressGesture(minimumDuration: 0) {
            isPressed = true
        } onPressingChanged: { pressing in
            isPressed = pressing
        }
    }
}

struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color
    
    @State private var isPressed = false
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(color)
                .scaleEffect(isPressed ? 0.9 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
            
            Text(title)
                .font(.headline)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        .onLongPressGesture(minimumDuration: 0) {
            isPressed = true
        } onPressingChanged: { pressing in
            isPressed = pressing
        }
    }
}

struct ActivityRow: View {
    let title: String
    let time: String
    
    @State private var isPressed = false
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.accentColor)
                .frame(width: 8, height: 8)
                .scaleEffect(isPressed ? 0.5 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                
                Text(time)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: 0) {
            isPressed = true
        } onPressingChanged: { pressing in
            isPressed = pressing
        }
    }
}
