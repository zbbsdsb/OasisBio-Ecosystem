export const OAUTH_SCOPES = {
  PROFILE: 'profile',
  EMAIL: 'email',
  OASISBIOS_READ: 'oasisbios:read',
  OASISBIOS_FULL: 'oasisbios:full',
  DCOS_READ: 'dcos:read'
} as const

export type OAuthScope = typeof OAUTH_SCOPES[keyof typeof OAUTH_SCOPES]

export const SCOPE_DESCRIPTIONS: Record<OAuthScope, { label: string; description: string }> = {
  [OAUTH_SCOPES.PROFILE]: {
    label: 'Profile',
    description: 'Access your user ID, username, display name, and avatar'
  },
  [OAUTH_SCOPES.EMAIL]: {
    label: 'Email',
    description: 'Access your email address'
  },
  [OAUTH_SCOPES.OASISBIOS_READ]: {
    label: 'Character List',
    description: 'Access your public character list (title, slug, tagline, cover image)'
  },
  [OAUTH_SCOPES.OASISBIOS_FULL]: {
    label: 'Full Character Data',
    description: 'Access complete character data including abilities, worlds, eras, and references'
  },
  [OAUTH_SCOPES.DCOS_READ]: {
    label: 'DCOS Documents',
    description: 'Access your character DCOS document content'
  }
}

export const DEFAULT_SCOPES: OAuthScope[] = [
  OAUTH_SCOPES.PROFILE,
  OAUTH_SCOPES.EMAIL,
  OAUTH_SCOPES.OASISBIOS_READ
]

export interface OAuthConfig {
  clientId: string
  authorizationEndpoint: string
  tokenEndpoint: string
  userInfoEndpoint: string
  revokeEndpoint: string
  redirectUri: string
  scopes: OAuthScope[]
}

export interface AuthorizationRequest {
  clientId: string
  redirectUri: string
  scope: string
  state: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string
  scope: string
  expiresAt: Date
}

export interface TokenRequest {
  grantType: 'authorization_code' | 'refresh_token'
  code?: string
  redirectUri?: string
  codeVerifier?: string
  refreshToken?: string
  clientId: string
  clientSecret?: string
}

export interface UserInfoResponse {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  email?: string
}

export interface OAuthError {
  error: string
  errorDescription?: string
}

export interface PKCEPair {
  codeVerifier: string
  codeChallenge: string
}

export interface StoredTokenData {
  accessToken: string
  refreshToken: string
  expiresAt: string
  scope: string
  clientId: string
}

export interface OAuthAppRegistration {
  name: string
  description: string
  homepageUrl: string
  redirectUris: string[]
  logoUrl?: string
}

export interface OAuthApp {
  id: string
  clientId: string
  clientSecret: string
  name: string
  description: string
  homepageUrl: string
  redirectUris: string[]
  logoUrl: string | null
  ownerUserId: string
  createdAt: Date
  updatedAt: Date
}

export const OAUTH_ENDPOINTS = {
  AUTHORIZE: '/oauth/authorize',
  TOKEN: '/oauth/token',
  USERINFO: '/oauth/userinfo',
  REVOKE: '/oauth/revoke',
  DISCOVERY: '/oauth/.well-known/openid-configuration'
} as const

export const TOKEN_STORAGE_KEY = 'oasisbio-oauth-tokens'
export const PKCE_STATE_KEY = 'oasisbio-oauth-state'
export const CODE_VERIFIER_KEY = 'oasisbio-oauth-code-verifier'
