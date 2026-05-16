import SwiftUI

struct OAuthDocsView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    QuickStartSection()
                    
                    IntegrationCodeSection()
                    
                    ScopesSection()
                    
                    SecuritySection()
                    
                    APIEndpointsSection()
                    
                    TryItSection()
                }
                .padding()
            }
            .navigationTitle("OAuth 集成指南")
        }
    }
}

struct QuickStartSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("快速开始", systemImage: "book")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("按照以下步骤将 OAuth 身份验证集成到您的应用程序中：")
                .font(.body)
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 12) {
                QuickStartStep(
                    number: 1,
                    title: "注册应用",
                    description: "在开发者门户注册您的应用，获取 client_id"
                )
                
                QuickStartStep(
                    number: 2,
                    title: "实现 PKCE 流程",
                    description: "在您的应用中生成 code_verifier 和 code_challenge"
                )
                
                QuickStartStep(
                    number: 3,
                    title: "重定向用户",
                    description: "将用户重定向到 OasisBio 授权端点"
                )
                
                QuickStartStep(
                    number: 4,
                    title: "交换令牌",
                    description: "将授权码交换为访问令牌和刷新令牌"
                )
                
                QuickStartStep(
                    number: 5,
                    title: "使用令牌",
                    description: "使用访问令牌调用受保护的 API 端点"
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct QuickStartStep: View {
    let number: Int
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.headline)
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(Color.blue)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct IntegrationCodeSection: View {
    @State private var selectedTab = 0
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("集成代码", systemImage: "chevron.left.forwardslash.chevron.right")
                .font(.title2)
                .fontWeight(.bold)
            
            Picker("代码示例", selection: $selectedTab) {
                Text("授权 URL").tag(0)
                Text("令牌交换").tag(1)
                Text("刷新令牌").tag(2)
            }
            .pickerStyle(.segmented)
            
            Group {
                switch selectedTab {
                case 0:
                    AuthorizationCodeView()
                case 1:
                    TokenExchangeView()
                case 2:
                    RefreshTokenView()
                default:
                    EmptyView()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AuthorizationCodeView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("1. 生成授权 URL")
                .font(.headline)
            
            CodeBlock(code: """
            const authUrl = new URL('/oauth/authorize');
            authUrl.searchParams.set('client_id', YOUR_CLIENT_ID);
            authUrl.searchParams.set('redirect_uri', YOUR_REDIRECT_URI);
            authUrl.searchParams.set('scope', 'profile email oasisbios:read');
            authUrl.searchParams.set('state', generateRandomState());
            authUrl.searchParams.set('code_challenge', codeChallenge);
            authUrl.searchParams.set('code_challenge_method', 'S256');
            
            // 重定向用户
            window.location.href = authUrl.toString();
            """)
        }
    }
}

struct TokenExchangeView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("2. 令牌交换")
                .font(.headline)
            
            CodeBlock(code: """
            const response = await fetch('/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: authorizationCode,
                    redirect_uri: YOUR_REDIRECT_URI,
                    code_verifier: codeVerifier,
                    client_id: YOUR_CLIENT_ID
                })
            });
            
            const { access_token, refresh_token, expires_in } = await response.json();
            """)
        }
    }
}

struct RefreshTokenView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("3. 刷新令牌")
                .font(.headline)
            
            CodeBlock(code: """
            const response = await fetch('/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: YOUR_CLIENT_ID
                })
            });
            """)
        }
    }
}

struct CodeBlock: View {
    let code: String
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            Text(code)
                .font(.system(.caption, design: .monospaced))
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color.black.opacity(0.05))
        .cornerRadius(8)
    }
}

struct ScopesSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("可用作用域", systemImage: "key")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(spacing: 12) {
                ScopeRow(
                    scope: "profile",
                    label: "个人资料",
                    description: "用户 ID、用户名、显示名称、头像"
                )
                
                ScopeRow(
                    scope: "email",
                    label: "邮箱",
                    description: "用户电子邮件地址"
                )
                
                ScopeRow(
                    scope: "oasisbios:read",
                    label: "角色列表",
                    description: "公开角色列表（标题、别名、标语、封面图）"
                )
                
                ScopeRow(
                    scope: "oasisbios:full",
                    label: "完整角色数据",
                    description: "包含能力、世界、时代等完整角色数据"
                )
                
                ScopeRow(
                    scope: "dcos:read",
                    label: "DCOS 文档",
                    description: "角色 DCOS 文档内容"
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ScopeRow: View {
    let scope: String
    let label: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text(scope)
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.blue)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(6)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct SecuritySection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("安全最佳实践", systemImage: "shield")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 12) {
                SecurityItem(text: "始终使用 PKCE（S256 方法）进行授权请求")
                SecurityItem(text: "验证 state 参数以防止 CSRF 攻击")
                SecurityItem(text: "安全存储令牌（Web 应用避免使用 localStorage）")
                SecurityItem(text: "实现刷新令牌轮换")
                SecurityItem(text: "所有 OAuth 通信使用 HTTPS")
                SecurityItem(text: "精确验证 redirect URIs（生产环境禁止使用通配符）")
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct SecurityItem: View {
    let text: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.caption)
            
            Text(text)
                .font(.subheadline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct APIEndpointsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("API 端点", systemImage: "globe")
                .font(.title2)
                .fontWeight(.bold)
            
            VStack(spacing: 8) {
                EndpointRow(method: "GET", endpoint: "/oauth/authorize", description: "授权端点")
                EndpointRow(method: "POST", endpoint: "/oauth/token", description: "令牌交换和刷新")
                EndpointRow(method: "GET", endpoint: "/oauth/userinfo", description: "获取用户资料")
                EndpointRow(method: "POST", endpoint: "/oauth/revoke", description: "撤销令牌")
                EndpointRow(method: "GET", endpoint: "/oauth/.well-known/openid-configuration", description: "OIDC 发现")
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct EndpointRow: View {
    let method: String
    let endpoint: String
    let description: String
    
    var body: some View {
        HStack(spacing: 12) {
            Text(method)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(method == "GET" ? Color.green : Color.blue)
                .cornerRadius(6)
            
            Text(endpoint)
                .font(.system(.caption, design: .monospaced))
            
            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct TryItSection: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("体验「使用 Oasis 登录」按钮")
                .font(.title3)
                .fontWeight(.semibold)
            
            Text("亲身体验 OAuth 流程")
                .font(.body)
                .foregroundColor(.secondary)
            
            Button(action: {}) {
                Label("立即体验", systemImage: "arrow.right.circle")
                    .font(.headline)
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(12)
    }
}
