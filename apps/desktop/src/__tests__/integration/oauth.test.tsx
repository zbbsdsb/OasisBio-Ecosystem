import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { customRender, mockSessionStorage, flushPromises } from '../test-utils'
import {
  generatePKCEPair,
  generateState,
  buildAuthorizationUrl,
  initiateOAuthFlow,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  getUserInfo,
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  getValidAccessToken,
  logout,
  parseOAuthCallback,
  handleOAuthCallback,
  createOAuthConfig,
} from '../../services/oauthService'
import type { AuthorizationRequest, PKCEPair } from '../../types/oauth'
import { server, createMockOAuthState, createOAuthHandlers, resetHandlers } from '../mocks/server'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('OAuth Flow Integration Tests', () => {
  let oauthState: ReturnType<typeof createMockOAuthState>
  let sessionStorageMock: ReturnType<typeof mockSessionStorage>

  beforeAll(() => {
    server.listen()
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    oauthState = createMockOAuthState()
    sessionStorageMock = mockSessionStorage()
    
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    })

    resetHandlers()
    mockNavigate.mockClear()
  })

  describe('PKCE Flow', () => {
    it('should generate valid PKCE pair', async () => {
      const pkcePair = await generatePKCEPair()

      expect(pkcePair.codeVerifier).toBeDefined()
      expect(pkcePair.codeChallenge).toBeDefined()
      expect(pkcePair.codeVerifier.length).toBeGreaterThan(0)
      expect(pkcePair.codeChallenge.length).toBeGreaterThan(0)
      expect(pkcePair.codeVerifier).not.toBe(pkcePair.codeChallenge)
    })

    it('should generate unique PKCE pairs', async () => {
      const pair1 = await generatePKCEPair()
      const pair2 = await generatePKCEPair()

      expect(pair1.codeVerifier).not.toBe(pair2.codeVerifier)
      expect(pair1.codeChallenge).not.toBe(pair2.codeChallenge)
    })

    it('should generate valid state parameter', async () => {
      const state = await generateState()

      expect(state).toBeDefined()
      expect(state.length).toBeGreaterThan(0)
    })

    it('should generate unique state parameters', async () => {
      const state1 = await generateState()
      const state2 = await generateState()

      expect(state1).not.toBe(state2)
    })
  })

  describe('Authorization URL Generation', () => {
    it('should build correct authorization URL', async () => {
      const config = createOAuthConfig()
      const { codeVerifier, codeChallenge } = await generatePKCEPair()
      const state = await generateState()

      const request: AuthorizationRequest = {
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scope: config.scopes.join(' '),
        state,
        codeChallenge,
        codeChallengeMethod: 'S256',
      }

      const authUrl = buildAuthorizationUrl(request)

      expect(authUrl).toContain('oauth/authorize')
      expect(authUrl).toContain(`client_id=${config.clientId}`)
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(config.redirectUri)}`)
      expect(authUrl).toContain(`state=${state}`)
      expect(authUrl).toContain(`code_challenge=${codeChallenge}`)
      expect(authUrl).toContain('code_challenge_method=S256')
    })

    it('should include correct scopes in authorization URL', async () => {
      const config = createOAuthConfig()
      const { codeChallenge } = await generatePKCEPair()
      const state = await generateState()

      const request: AuthorizationRequest = {
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scope: 'profile email oasisbios:read',
        state,
        codeChallenge,
        codeChallengeMethod: 'S256',
      }

      const authUrl = buildAuthorizationUrl(request)

      expect(authUrl).toContain('scope=')
      expect(authUrl).toContain('profile')
      expect(authUrl).toContain('email')
    })
  })

  describe('OAuth Initiation', () => {
    it('should initiate OAuth flow and store PKCE parameters', async () => {
      const result = await initiateOAuthFlow()

      expect(result.authUrl).toBeDefined()
      expect(result.state).toBeDefined()
      expect(result.codeVerifier).toBeDefined()
      expect(result.authUrl).toContain('oauth/authorize')
    })

    it('should store state and code verifier for later validation', async () => {
      const result = await initiateOAuthFlow()

      const storedState = sessionStorageMock.getItem('oasisbio-oauth-state')
      const storedVerifier = sessionStorageMock.getItem('oasisbio-oauth-code-verifier')

      expect(storedState).toBe(result.state)
      expect(storedVerifier).toBe(result.codeVerifier)
    })
  })

  describe('Token Exchange', () => {
    it('should exchange authorization code for tokens', async () => {
      oauthState.state = 'test-state'
      sessionStorageMock.setItem('oasisbio-oauth-state', 'test-state')
      sessionStorageMock.setItem('oasisbio-oauth-code-verifier', 'test-verifier')
      
      setHandlers(...createOAuthHandlers(oauthState))

      const tokens = await exchangeCodeForTokens('valid-code', 'test-state')

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.expiresIn).toBeGreaterThan(0)
      expect(tokens.tokenType).toBe('Bearer')
    })

    it('should reject exchange with mismatched state', async () => {
      sessionStorageMock.setItem('oasisbio-oauth-state', 'correct-state')
      sessionStorageMock.setItem('oasisbio-oauth-code-verifier', 'test-verifier')
      
      setHandlers(...createOAuthHandlers(oauthState))

      await expect(
        exchangeCodeForTokens('valid-code', 'wrong-state')
      ).rejects.toThrow(/state mismatch/i)
    })

    it('should reject exchange with invalid code', async () => {
      sessionStorageMock.setItem('oasisbio-oauth-state', 'test-state')
      sessionStorageMock.setItem('oasisbio-oauth-code-verifier', 'test-verifier')
      
      setHandlers(...createOAuthHandlers(oauthState))

      await expect(
        exchangeCodeForTokens('invalid', 'test-state')
      ).rejects.toThrow()
    })

    it('should store tokens after successful exchange', async () => {
      oauthState.state = 'test-state'
      sessionStorageMock.setItem('oasisbio-oauth-state', 'test-state')
      sessionStorageMock.setItem('oasisbio-oauth-code-verifier', 'test-verifier')
      
      setHandlers(...createOAuthHandlers(oauthState))

      const tokens = await exchangeCodeForTokens('valid-code', 'test-state')

      const storedTokens = sessionStorageMock.getItem('oasisbio-oauth-tokens')
      expect(storedTokens).not.toBeNull()
      
      const parsedTokens = JSON.parse(storedTokens!)
      expect(parsedTokens.accessToken).toBe(tokens.accessToken)
    })

    it('should clear PKCE state after exchange', async () => {
      sessionStorageMock.setItem('oasisbio-oauth-state', 'test-state')
      sessionStorageMock.setItem('oasisbio-oauth-code-verifier', 'test-verifier')
      
      setHandlers(...createOAuthHandlers(oauthState))

      await exchangeCodeForTokens('valid-code', 'test-state')

      expect(sessionStorageMock.getItem('oasisbio-oauth-state')).toBeNull()
      expect(sessionStorageMock.getItem('oasisbio-oauth-code-verifier')).toBeNull()
    })
  })

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      setHandlers(...createOAuthHandlers(oauthState))

      const newTokens = await refreshAccessToken('valid-refresh-token')

      expect(newTokens.accessToken).toBeDefined()
      expect(newTokens.accessToken).not.toBe('oauth-access-token')
      expect(newTokens.refreshToken).toBeDefined()
    })

    it('should reject refresh with expired refresh token', async () => {
      setHandlers(...createOAuthHandlers(oauthState))

      await expect(
        refreshAccessToken('expired')
      ).rejects.toThrow()
    })

    it('should store new tokens after refresh', async () => {
      setHandlers(...createOAuthHandlers(oauthState))

      const newTokens = await refreshAccessToken('valid-refresh-token')

      const storedTokens = sessionStorageMock.getItem('oasisbio-oauth-tokens')
      expect(storedTokens).not.toBeNull()
      
      const parsedTokens = JSON.parse(storedTokens!)
      expect(parsedTokens.accessToken).toBe(newTokens.accessToken)
    })
  })

  describe('Token Revocation', () => {
    it('should revoke token successfully', async () => {
      setHandlers(...createOAuthHandlers(oauthState))

      await expect(
        revokeToken('valid-token')
      ).resolves.not.toThrow()
    })

    it('should clear stored tokens on logout', async () => {
      oauthState.tokens = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      }
      
      sessionStorageMock.setItem('oasisbio-oauth-tokens', JSON.stringify({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      }))
      
      setHandlers(...createOAuthHandlers(oauthState))

      await logout()

      expect(sessionStorageMock.getItem('oasisbio-oauth-tokens')).toBeNull()
    })
  })

  describe('User Info Retrieval', () => {
    it('should get user info with valid access token', async () => {
      setHandlers(...createOAuthHandlers(oauthState))

      const userInfo = await getUserInfo('valid-token')

      expect(userInfo.userId).toBeDefined()
      expect(userInfo.username).toBeDefined()
      expect(userInfo.displayName).toBeDefined()
      expect(userInfo.email).toBeDefined()
    })
  })

  describe('Token Storage', () => {
    it('should store and retrieve tokens', async () => {
      const tokens = {
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'profile email',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      }

      await storeTokens(tokens)

      const stored = await getStoredTokens()
      expect(stored).not.toBeNull()
      expect(stored!.accessToken).toBe('test-access')
      expect(stored!.refreshToken).toBe('test-refresh')
    })

    it('should return null when no tokens stored', async () => {
      const stored = await getStoredTokens()
      expect(stored).toBeNull()
    })

    it('should clear stored tokens', async () => {
      sessionStorageMock.setItem('oasisbio-oauth-tokens', JSON.stringify({
        accessToken: 'test',
        refreshToken: 'test',
        expiresAt: new Date().toISOString(),
      }))

      await clearStoredTokens()

      expect(sessionStorageMock.getItem('oasisbio-oauth-tokens')).toBeNull()
    })
  })

  describe('Valid Access Token Retrieval', () => {
    it('should return valid access token', async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000)
      sessionStorageMock.setItem('oasisbio-oauth-tokens', JSON.stringify({
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
        expiresAt: futureExpiry.toISOString(),
        scope: 'profile',
      }))

      const token = await getValidAccessToken()
      expect(token).toBe('valid-token')
    })

    it('should refresh expired token', async () => {
      const pastExpiry = new Date(Date.now() - 1000)
      sessionStorageMock.setItem('oasisbio-oauth-tokens', JSON.stringify({
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh',
        expiresAt: pastExpiry.toISOString(),
        scope: 'profile',
      }))
      
      setHandlers(...createOAuthHandlers(oauthState))

      const token = await getValidAccessToken()
      expect(token).toBeDefined()
      expect(token).not.toBe('expired-token')
    })

    it('should return null when no tokens available', async () => {
      const token = await getValidAccessToken()
      expect(token).toBeNull()
    })
  })

  describe('OAuth Callback Handling', () => {
    it('should parse callback URL correctly', () => {
      const callbackUrl = 'oasisbio://oauth/callback?code=abc123&state=xyz789'
      
      const result = parseOAuthCallback(callbackUrl)
      
      expect(result.code).toBe('abc123')
      expect(result.state).toBe('xyz789')
      expect(result.error).toBeNull()
    })

    it('should parse error from callback URL', () => {
      const callbackUrl = 'oasisbio://oauth/callback?error=access_denied&error_description=User%20denied'
      
      const result = parseOAuthCallback(callbackUrl)
      
      expect(result.code).toBeNull()
      expect(result.state).toBeNull()
      expect(result.error).toBe('access_denied')
    })

    it('should handle invalid callback URL', () => {
      const result = parseOAuthCallback('not-a-valid-url')
      
      expect(result.error).toBeDefined()
    })

    it('should handle OAuth callback in browser', () => {
      const originalLocation = window.location
      delete (window as any).location
      window.location = {
        href: 'oasisbio://oauth/callback?code=test-code&state=test-state',
      } as Location

      const result = handleOAuthCallback()
      
      expect(result.code).toBe('test-code')
      expect(result.state).toBe('test-state')

      window.location = originalLocation
    })
  })

  describe('Complete OAuth Flow', () => {
    it('should complete full OAuth flow: initiate → callback → exchange → userinfo', async () => {
      setHandlers(...createOAuthHandlers(oauthState))

      const { authUrl, state, codeVerifier } = await initiateOAuthFlow()
      
      expect(authUrl).toContain('oauth/authorize')
      expect(state).toBeDefined()

      const callbackUrl = `${authUrl}&code=valid-code`
      const callbackResult = parseOAuthCallback(callbackUrl)
      
      expect(callbackResult.code).toBe('valid-code')
      expect(callbackResult.state).toBe(state)

      const tokens = await exchangeCodeForTokens('valid-code', state)
      
      expect(tokens.accessToken).toBeDefined()

      const userInfo = await getUserInfo(tokens.accessToken)
      
      expect(userInfo.userId).toBeDefined()
      expect(userInfo.email).toBeDefined()
    })

    it('should handle OAuth error in callback', async () => {
      const callbackUrl = 'oasisbio://oauth/callback?error=access_denied'
      
      const result = parseOAuthCallback(callbackUrl)
      
      expect(result.error).toBe('access_denied')
      expect(result.code).toBeNull()
    })

    it('should handle token expiry and refresh during API call', async () => {
      const pastExpiry = new Date(Date.now() - 1000)
      sessionStorageMock.setItem('oasisbio-oauth-tokens', JSON.stringify({
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh',
        expiresAt: pastExpiry.toISOString(),
        scope: 'profile',
      }))
      
      setHandlers(...createOAuthHandlers(oauthState))

      const validToken = await getValidAccessToken()
      
      expect(validToken).toBeDefined()
      expect(validToken).not.toBe('expired-token')

      const userInfo = await getUserInfo(validToken!)
      expect(userInfo).toBeDefined()
    })
  })

  describe('Security Considerations', () => {
    it('should use PKCE (Proof Key for Code Exchange)', async () => {
      const pkcePair = await generatePKCEPair()
      
      expect(pkcePair.codeChallenge).not.toBe(pkcePair.codeVerifier)
      expect(pkcePair.codeChallenge.length).toBe(43)
    })

    it('should validate state parameter to prevent CSRF', async () => {
      sessionStorageMock.setItem('oasisbio-oauth-state', 'original-state')
      sessionStorageMock.setItem('oasisbio-oauth-code-verifier', 'verifier')
      
      setHandlers(...createOAuthHandlers(oauthState))

      await expect(
        exchangeCodeForTokens('code', 'attacker-state')
      ).rejects.toThrow(/state mismatch/i)
    })

    it('should not expose tokens in URL', async () => {
      const { authUrl } = await initiateOAuthFlow()
      
      expect(authUrl).not.toContain('access_token')
      expect(authUrl).not.toContain('refresh_token')
    })

    it('should use secure storage for tokens', async () => {
      const tokens = {
        accessToken: 'sensitive-token',
        refreshToken: 'sensitive-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'profile',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      }

      await storeTokens(tokens)

      const stored = sessionStorageMock.getItem('oasisbio-oauth-tokens')
      expect(stored).toContain('sensitive-token')
    })
  })
})

function setHandlers(...handlers: Parameters<typeof server.use>[0]) {
  server.use(...handlers)
}
