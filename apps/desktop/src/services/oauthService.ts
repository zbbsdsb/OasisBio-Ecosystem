import type {
  OAuthConfig,
  AuthorizationRequest,
  TokenResponse,
  TokenRequest,
  UserInfoResponse,
  PKCEPair,
  StoredTokenData,
  OAuthScope,
  OAuthError
} from '../types/oauth'
import {
  OAUTH_ENDPOINTS,
  DEFAULT_SCOPES,
  TOKEN_STORAGE_KEY,
  PKCE_STATE_KEY,
  CODE_VERIFIER_KEY
} from '../types/oauth'

const OAUTH_API_BASE = import.meta.env.VITE_OAUTH_API_URL || process.env.VITE_OAUTH_API_URL || ''
const OAUTH_CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID || process.env.VITE_OAUTH_CLIENT_ID || ''
const OAUTH_REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI || process.env.VITE_OAUTH_REDIRECT_URI || 'oasisbio://oauth/callback'

const SERVICE_NAME = 'oasisbio-oauth'

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues)
    .map(v => chars[v % chars.length])
    .join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function generatePKCEPair(): Promise<PKCEPair> {
  const codeVerifier = generateRandomString(64)
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64UrlEncode(hashed)
  
  return {
    codeVerifier,
    codeChallenge
  }
}

export async function generateState(): Promise<string> {
  return generateRandomString(32)
}

function createOAuthConfig(): OAuthConfig {
  return {
    clientId: OAUTH_CLIENT_ID,
    authorizationEndpoint: `${OAUTH_API_BASE}${OAUTH_ENDPOINTS.AUTHORIZE}`,
    tokenEndpoint: `${OAUTH_API_BASE}${OAUTH_ENDPOINTS.TOKEN}`,
    userInfoEndpoint: `${OAUTH_API_BASE}${OAUTH_ENDPOINTS.USERINFO}`,
    revokeEndpoint: `${OAUTH_API_BASE}${OAUTH_ENDPOINTS.REVOKE}`,
    redirectUri: OAUTH_REDIRECT_URI,
    scopes: DEFAULT_SCOPES
  }
}

function createAuthorizationRequest(
  config: OAuthConfig,
  state: string,
  codeChallenge: string
): AuthorizationRequest {
  return {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    codeChallenge,
    codeChallengeMethod: 'S256'
  }
}

export function buildAuthorizationUrl(request: AuthorizationRequest): string {
  const params = new URLSearchParams({
    client_id: request.clientId,
    redirect_uri: request.redirectUri,
    scope: request.scope,
    state: request.state,
    code_challenge: request.codeChallenge,
    code_challenge_method: request.codeChallengeMethod
  })
  
  return `${request.redirectUri.replace(/\/callback.*$/, '')}${OAUTH_ENDPOINTS.AUTHORIZE}?${params.toString()}`
}

export async function initiateOAuthFlow(): Promise<{ authUrl: string; state: string; codeVerifier: string }> {
  const config = createOAuthConfig()
  const { codeVerifier, codeChallenge } = await generatePKCEPair()
  const state = await generateState()
  
  await storeCodeVerifier(codeVerifier)
  await storeState(state)
  
  const request = createAuthorizationRequest(config, state, codeChallenge)
  const authUrl = buildAuthorizationUrl(request)
  
  return { authUrl, state, codeVerifier }
}

export async function exchangeCodeForTokens(
  code: string,
  state: string
): Promise<TokenResponse> {
  const storedState = await getStoredState()
  if (state !== storedState) {
    throw new Error('OAuth state mismatch - potential CSRF attack')
  }
  
  const codeVerifier = await getStoredCodeVerifier()
  if (!codeVerifier) {
    throw new Error('Code verifier not found')
  }
  
  const config = createOAuthConfig()
  
  const request: TokenRequest = {
    grantType: 'authorization_code',
    code,
    redirectUri: config.redirectUri,
    codeVerifier,
    clientId: config.clientId
  }
  
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    const errorData = await response.json() as OAuthError
    throw new Error(errorData.errorDescription || errorData.error || 'Token exchange failed')
  }
  
  const data = await response.json()
  
  await clearOAuthState()
  
  const tokenResponse: TokenResponse = {
    accessToken: data.access_token,
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in || 3600,
    refreshToken: data.refresh_token,
    scope: data.scope || '',
    expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000)
  }
  
  await storeTokens(tokenResponse)
  
  return tokenResponse
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = createOAuthConfig()
  
  const request: TokenRequest = {
    grantType: 'refresh_token',
    refreshToken,
    clientId: config.clientId
  }
  
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    const errorData = await response.json() as OAuthError
    throw new Error(errorData.errorDescription || errorData.error || 'Token refresh failed')
  }
  
  const data = await response.json()
  
  const tokenResponse: TokenResponse = {
    accessToken: data.access_token,
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in || 3600,
    refreshToken: data.refresh_token,
    scope: data.scope || '',
    expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000)
  }
  
  await storeTokens(tokenResponse)
  
  return tokenResponse
}

export async function revokeToken(token: string): Promise<void> {
  const config = createOAuthConfig()
  
  const response = await fetch(config.revokeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, client_id: config.clientId })
  })
  
  if (!response.ok) {
    throw new Error('Token revocation failed')
  }
}

export async function getUserInfo(accessToken: string): Promise<UserInfoResponse> {
  const config = createOAuthConfig()
  
  const response = await fetch(config.userInfoEndpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get user info')
  }
  
  return response.json()
}

export async function storeTokens(tokens: TokenResponse): Promise<void> {
  try {
    const { ipcRenderer } = window as any
    
    if (ipcRenderer) {
      await ipcRenderer.invoke('oauth:store-tokens', JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt.toISOString(),
        scope: tokens.scope,
        clientId: createOAuthConfig().clientId
      }))
    } else {
      if (typeof keytar !== 'undefined') {
        await keytar.setPassword(SERVICE_NAME, 'tokens', JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt.toISOString(),
          scope: tokens.scope,
          clientId: createOAuthConfig().clientId
        }))
      } else {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt.toISOString(),
          scope: tokens.scope,
          clientId: createOAuthConfig().clientId
        }))
      }
    }
  } catch (error) {
    console.error('Failed to store tokens:', error)
    throw error
  }
}

export async function getStoredTokens(): Promise<StoredTokenData | null> {
  try {
    const { ipcRenderer } = window as any
    let tokenData: string | null = null
    
    if (ipcRenderer) {
      tokenData = await ipcRenderer.invoke('oauth:get-stored-tokens')
    } else {
      if (typeof keytar !== 'undefined') {
        tokenData = await keytar.getPassword(SERVICE_NAME, 'tokens')
      } else {
        tokenData = sessionStorage.getItem(TOKEN_STORAGE_KEY)
      }
    }
    
    if (!tokenData) return null
    
    const parsed = JSON.parse(tokenData)
    return {
      ...parsed,
      expiresAt: parsed.expiresAt
    }
  } catch (error) {
    console.error('Failed to get stored tokens:', error)
    return null
  }
}

export async function clearStoredTokens(): Promise<void> {
  try {
    const { ipcRenderer } = window as any
    
    if (ipcRenderer) {
      await ipcRenderer.invoke('oauth:clear-stored-tokens')
    } else {
      if (typeof keytar !== 'undefined') {
        await keytar.deletePassword(SERVICE_NAME, 'tokens')
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    }
  } catch (error) {
    console.error('Failed to clear stored tokens:', error)
  }
}

async function storeCodeVerifier(verifier: string): Promise<void> {
  const { ipcRenderer } = window as any
  
  if (ipcRenderer) {
    await ipcRenderer.invoke('oauth:store-code-verifier', verifier)
  } else {
    if (typeof keytar !== 'undefined') {
      await keytar.setPassword(SERVICE_NAME, 'code-verifier', verifier)
    } else {
      sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
    }
  }
}

async function getStoredCodeVerifier(): Promise<string | null> {
  const { ipcRenderer } = window as any
  
  if (ipcRenderer) {
    return await ipcRenderer.invoke('oauth:get-stored-code-verifier')
  } else {
    if (typeof keytar !== 'undefined') {
      return await keytar.getPassword(SERVICE_NAME, 'code-verifier')
    } else {
      return sessionStorage.getItem(CODE_VERIFIER_KEY)
    }
  }
}

async function storeState(state: string): Promise<void> {
  const { ipcRenderer } = window as any
  
  if (ipcRenderer) {
    await ipcRenderer.invoke('oauth:store-state', state)
  } else {
    if (typeof keytar !== 'undefined') {
      await keytar.setPassword(SERVICE_NAME, 'state', state)
    } else {
      sessionStorage.setItem(PKCE_STATE_KEY, state)
    }
  }
}

async function getStoredState(): Promise<string | null> {
  const { ipcRenderer } = window as any
  
  if (ipcRenderer) {
    return await ipcRenderer.invoke('oauth:get-stored-state')
  } else {
    if (typeof keytar !== 'undefined') {
      return await keytar.getPassword(SERVICE_NAME, 'state')
    } else {
      return sessionStorage.getItem(PKCE_STATE_KEY)
    }
  }
}

async function clearOAuthState(): Promise<void> {
  const { ipcRenderer } = window as any
  
  if (ipcRenderer) {
    await ipcRenderer.invoke('oauth:clear-oauth-state')
  } else {
    if (typeof keytar !== 'undefined') {
      await keytar.deletePassword(SERVICE_NAME, 'code-verifier')
      await keytar.deletePassword(SERVICE_NAME, 'state')
    } else {
      sessionStorage.removeItem(CODE_VERIFIER_KEY)
      sessionStorage.removeItem(PKCE_STATE_KEY)
    }
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const stored = await getStoredTokens()
  
  if (!stored) return null
  
  if (new Date(stored.expiresAt) < new Date()) {
    try {
      const newTokens = await refreshAccessToken(stored.refreshToken)
      return newTokens.accessToken
    } catch {
      await clearStoredTokens()
      return null
    }
  }
  
  return stored.accessToken
}

export async function logout(): Promise<void> {
  const stored = await getStoredTokens()
  
  if (stored?.accessToken) {
    try {
      await revokeToken(stored.accessToken)
    } catch (error) {
      console.warn('Token revocation failed, continuing with logout:', error)
    }
  }
  
  await clearStoredTokens()
}

export function parseOAuthCallback(url: string): { code: string | null; state: string | null; error: string | null } {
  try {
    const urlObj = new URL(url)
    const code = urlObj.searchParams.get('code')
    const state = urlObj.searchParams.get('state')
    const error = urlObj.searchParams.get('error')
    
    return { code, state, error }
  } catch {
    return { code: null, state: null, error: 'Invalid callback URL' }
  }
}

export function handleOAuthCallback(): { code: string | null; state: string | null; error: string | null } {
  if (typeof window === 'undefined') {
    return { code: null, state: null, error: 'Not in browser environment' }
  }
  
  return parseOAuthCallback(window.location.href)
}

export { createOAuthConfig }
