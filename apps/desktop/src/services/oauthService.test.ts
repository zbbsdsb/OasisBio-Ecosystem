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
  createOAuthConfig
} from './oauthService';
import type { TokenResponse } from '../types/oauth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

describe('OAuth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    delete (window as any).ipcRenderer;
    process.env.VITE_OAUTH_CLIENT_ID = 'test-client-id';
    process.env.VITE_OAUTH_API_URL = 'https://oauth.test.com';
    process.env.VITE_OAUTH_REDIRECT_URI = 'oasisbio://oauth/callback';
  });

  afterEach(() => {
    delete process.env.VITE_OAUTH_CLIENT_ID;
    delete process.env.VITE_OAUTH_API_URL;
    delete process.env.VITE_OAUTH_REDIRECT_URI;
  });

  describe('generatePKCEPair', () => {
    it('should generate valid PKCE pair', async () => {
      const result = await generatePKCEPair();

      expect(result.codeVerifier).toBeDefined();
      expect(result.codeChallenge).toBeDefined();
      expect(result.codeVerifier.length).toBe(64);
    });

    it('should generate different values each time', async () => {
      const pair1 = await generatePKCEPair();
      const pair2 = await generatePKCEPair();

      expect(pair1.codeVerifier).not.toBe(pair2.codeVerifier);
    });
  });

  describe('generateState', () => {
    it('should generate random state string', async () => {
      const state = await generateState();

      expect(state).toBeDefined();
      expect(state.length).toBe(32);
    });

    it('should generate different states each time', async () => {
      const state1 = await generateState();
      const state2 = await generateState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('createOAuthConfig', () => {
    it('should create config from environment variables', () => {
      const config = createOAuthConfig();

      expect(config.clientId).toBe('test-client-id');
      expect(config.authorizationEndpoint).toContain('/oauth/authorize');
      expect(config.tokenEndpoint).toContain('/oauth/token');
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('should build valid authorization URL', () => {
      const request = {
        clientId: 'test-client',
        redirectUri: 'oasisbio://oauth/callback',
        scope: 'profile email',
        state: 'test-state',
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256' as const
      };

      const url = buildAuthorizationUrl(request);

      expect(url).toContain('client_id=test-client');
      expect(url).toContain('state=test-state');
      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
    });
  });

  describe('initiateOAuthFlow', () => {
    it('should initiate OAuth flow and store state', async () => {
      const result = await initiateOAuthFlow();

      expect(result.authUrl).toBeDefined();
      expect(result.state).toBeDefined();
      expect(result.codeVerifier).toBeDefined();
    });

    it('should store code verifier and state in sessionStorage', async () => {
      await initiateOAuthFlow();

      expect(sessionStorage.getItem('oasisbio-oauth-code-verifier')).not.toBeNull();
      expect(sessionStorage.getItem('oasisbio-oauth-state')).not.toBeNull();
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens', async () => {
      sessionStorage.setItem('oasisbio-oauth-state', 'test-state');
      sessionStorage.setItem('oasisbio-oauth-code-verifier', 'test-verifier');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const result = await exchangeCodeForTokens('auth-code', 'test-state');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw error on state mismatch', async () => {
      sessionStorage.setItem('oasisbio-oauth-state', 'correct-state');

      await expect(
        exchangeCodeForTokens('code', 'wrong-state')
      ).rejects.toThrow('OAuth state mismatch');
    });

    it('should throw error when code verifier not found', async () => {
      sessionStorage.setItem('oasisbio-oauth-state', 'test-state');

      await expect(
        exchangeCodeForTokens('code', 'test-state')
      ).rejects.toThrow('Code verifier not found');
    });

    it('should throw error on token exchange failure', async () => {
      sessionStorage.setItem('oasisbio-oauth-state', 'test-state');
      sessionStorage.setItem('oasisbio-oauth-code-verifier', 'test-verifier');

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'invalid_grant', error_description: 'Invalid code' })
      });

      await expect(
        exchangeCodeForTokens('invalid-code', 'test-state')
      ).rejects.toThrow('Invalid code');
    });

    it('should clear OAuth state after successful exchange', async () => {
      sessionStorage.setItem('oasisbio-oauth-state', 'test-state');
      sessionStorage.setItem('oasisbio-oauth-code-verifier', 'test-verifier');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600
        })
      });

      await exchangeCodeForTokens('code', 'test-state');

      expect(sessionStorage.getItem('oasisbio-oauth-state')).toBeNull();
      expect(sessionStorage.getItem('oasisbio-oauth-code-verifier')).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'refreshed-token',
          refresh_token: 'new-refresh',
          expires_in: 3600
        })
      });

      const result = await refreshAccessToken('old-refresh-token');

      expect(result.accessToken).toBe('refreshed-token');
    });

    it('should throw error on refresh failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'invalid_grant' })
      });

      await expect(
        refreshAccessToken('invalid-token')
      ).rejects.toThrow('Token refresh failed');
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await expect(revokeToken('token-to-revoke')).resolves.not.toThrow();
    });

    it('should throw error on revoke failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      await expect(revokeToken('token')).rejects.toThrow('Token revocation failed');
    });
  });

  describe('getUserInfo', () => {
    it('should get user info', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          userId: 'user-1',
          username: 'testuser',
          displayName: 'Test User',
          avatarUrl: null
        })
      });

      const result = await getUserInfo('access-token');

      expect(result.userId).toBe('user-1');
      expect(result.username).toBe('testuser');
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      await expect(getUserInfo('invalid-token')).rejects.toThrow('Failed to get user info');
    });
  });

  describe('storeTokens', () => {
    it('should store tokens in sessionStorage', async () => {
      const tokens: TokenResponse = {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'profile',
        expiresAt: new Date(Date.now() + 3600000)
      };

      await storeTokens(tokens);

      const stored = sessionStorage.getItem('oasisbio-oauth-tokens');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).accessToken).toBe('access');
    });

    it('should use ipcRenderer when available', async () => {
      const mockIpcRenderer = {
        invoke: jest.fn().mockResolvedValue(undefined)
      };
      (window as any).ipcRenderer = mockIpcRenderer;

      const tokens: TokenResponse = {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: 'profile',
        expiresAt: new Date(Date.now() + 3600000)
      };

      await storeTokens(tokens);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'oauth:store-tokens',
        expect.any(String)
      );
    });
  });

  describe('getStoredTokens', () => {
    it('should return stored tokens', async () => {
      const tokenData = {
        accessToken: 'stored-access',
        refreshToken: 'stored-refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scope: 'profile',
        clientId: 'test-client'
      };
      sessionStorage.setItem('oasisbio-oauth-tokens', JSON.stringify(tokenData));

      const result = await getStoredTokens();

      expect(result?.accessToken).toBe('stored-access');
    });

    it('should return null when no tokens stored', async () => {
      const result = await getStoredTokens();
      expect(result).toBeNull();
    });
  });

  describe('clearStoredTokens', () => {
    it('should clear stored tokens', async () => {
      sessionStorage.setItem('oasisbio-oauth-tokens', JSON.stringify({ accessToken: 'token' }));

      await clearStoredTokens();

      expect(sessionStorage.getItem('oasisbio-oauth-tokens')).toBeNull();
    });
  });

  describe('getValidAccessToken', () => {
    it('should return valid access token', async () => {
      const tokenData = {
        accessToken: 'valid-token',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scope: 'profile',
        clientId: 'test-client'
      };
      sessionStorage.setItem('oasisbio-oauth-tokens', JSON.stringify(tokenData));

      const result = await getValidAccessToken();

      expect(result).toBe('valid-token');
    });

    it('should return null when no tokens stored', async () => {
      const result = await getValidAccessToken();
      expect(result).toBeNull();
    });

    it('should refresh expired token', async () => {
      const tokenData = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        scope: 'profile',
        clientId: 'test-client'
      };
      sessionStorage.setItem('oasisbio-oauth-tokens', JSON.stringify(tokenData));

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'refreshed-token',
          refresh_token: 'new-refresh',
          expires_in: 3600
        })
      });

      const result = await getValidAccessToken();

      expect(result).toBe('refreshed-token');
    });

    it('should clear tokens on refresh failure', async () => {
      const tokenData = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        scope: 'profile',
        clientId: 'test-client'
      };
      sessionStorage.setItem('oasisbio-oauth-tokens', JSON.stringify(tokenData));

      mockFetch.mockResolvedValue({ ok: false });

      const result = await getValidAccessToken();

      expect(result).toBeNull();
      expect(sessionStorage.getItem('oasisbio-oauth-tokens')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should revoke token and clear storage', async () => {
      const tokenData = {
        accessToken: 'token-to-revoke',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scope: 'profile',
        clientId: 'test-client'
      };
      sessionStorage.setItem('oasisbio-oauth-tokens', JSON.stringify(tokenData));

      mockFetch.mockResolvedValue({ ok: true });

      await logout();

      expect(sessionStorage.getItem('oasisbio-oauth-tokens')).toBeNull();
    });

    it('should continue logout even if revoke fails', async () => {
      const tokenData = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scope: 'profile',
        clientId: 'test-client'
      };
      sessionStorage.setItem('oasisbio-oauth-tokens', JSON.stringify(tokenData));

      mockFetch.mockResolvedValue({ ok: false });

      await logout();

      expect(sessionStorage.getItem('oasisbio-oauth-tokens')).toBeNull();
    });
  });

  describe('parseOAuthCallback', () => {
    it('should parse callback URL correctly', () => {
      const url = 'oasisbio://oauth/callback?code=auth-code&state=test-state';

      const result = parseOAuthCallback(url);

      expect(result.code).toBe('auth-code');
      expect(result.state).toBe('test-state');
      expect(result.error).toBeNull();
    });

    it('should parse error from callback URL', () => {
      const url = 'oasisbio://oauth/callback?error=access_denied&error_description=User%20denied';

      const result = parseOAuthCallback(url);

      expect(result.code).toBeNull();
      expect(result.error).toBe('access_denied');
    });

    it('should handle invalid URL', () => {
      const result = parseOAuthCallback('not-a-valid-url');

      expect(result.error).toBe('Invalid callback URL');
    });
  });

  describe('handleOAuthCallback', () => {
    it('should parse current window location', () => {
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'oasisbio://callback?code=code&state=state' },
        writable: true
      });

      const result = handleOAuthCallback();

      expect(result.code).toBe('code');
      expect(result.state).toBe('state');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true
      });
    });

    it('should return error when not in browser', () => {
      const originalWindow = global.window;
      (global as any).window = undefined;

      const result = handleOAuthCallback();

      expect(result.error).toBe('Not in browser environment');

      global.window = originalWindow;
    });
  });
});
