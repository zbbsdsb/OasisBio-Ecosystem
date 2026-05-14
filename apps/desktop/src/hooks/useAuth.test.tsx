import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, useSession } from './useAuth';
import * as authService from '../services/auth';
import * as oauthService from '../services/oauthService';
import type { AuthSession } from '@oasisbio/common-auth';

jest.mock('../services/auth');
jest.mock('../services/oauthService');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockOauthService = oauthService as jest.Mocked<typeof oauthService>;

const mockSession: AuthSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    status: 'ACTIVE' as any,
    metadata: {}
  },
  profile: {
    id: 'test-user-id',
    userId: 'test-user-id',
    displayName: 'Test User',
    avatarUrl: null,
    bio: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    metadata: {}
  },
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: new Date(Date.now() + 3600000)
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockAuthService.getSession as jest.Mock).mockResolvedValue(null);
    (mockOauthService.logout as jest.Mock).mockResolvedValue(undefined);
    process.env.VITE_OAUTH_CLIENT_ID = 'test-client';
    process.env.VITE_OAUTH_API_URL = 'https://oauth.test.com';
  });

  afterEach(() => {
    delete process.env.VITE_OAUTH_CLIENT_ID;
    delete process.env.VITE_OAUTH_API_URL;
  });

  describe('AuthProvider', () => {
    it('should initialize with loading state', () => {
      (mockAuthService.getSession as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.session).toBeNull();
    });

    it('should load session on mount', async () => {
      (mockAuthService.getSession as jest.Mock).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).not.toBeNull();
      expect(result.current.session?.user.email).toBe('test@example.com');
    });

    it('should handle initialization error', async () => {
      (mockAuthService.getSession as jest.Mock).mockRejectedValue(
        new Error('Init failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      (mockAuthService.sendOtp as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.sendOtp('test@example.com');
      });

      expect(mockAuthService.sendOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle send OTP error', async () => {
      (mockAuthService.sendOtp as jest.Mock).mockRejectedValue(
        new Error('Failed to send OTP')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.sendOtp('test@example.com');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.error).not.toBeNull();
    });

    it('should set loading state during OTP send', async () => {
      let resolveOtp: () => void;
      (mockAuthService.sendOtp as jest.Mock).mockImplementation(
        () => new Promise<void>((resolve) => {
          resolveOtp = resolve;
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const sendPromise = act(async () => {
        await result.current.sendOtp('test@example.com');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveOtp!();
      });

      await sendPromise;
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and set session', async () => {
      (mockAuthService.verifyOtp as jest.Mock).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.verifyOtp('test@example.com', '123456');
      });

      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
      expect(result.current.session).not.toBeNull();
    });

    it('should handle verify OTP error', async () => {
      (mockAuthService.verifyOtp as jest.Mock).mockRejectedValue(
        new Error('Invalid OTP')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.verifyOtp('test@example.com', 'wrong');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      (mockAuthService.getSession as jest.Mock).mockResolvedValue(mockSession);
      (mockAuthService.signOut as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockOauthService.logout).toHaveBeenCalled();
      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(result.current.session).toBeNull();
    });

    it('should handle sign out error', async () => {
      (mockAuthService.signOut as jest.Mock).mockRejectedValue(
        new Error('Sign out failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const newSession = {
        ...mockSession,
        accessToken: 'new-access-token'
      };
      (mockAuthService.getSession as jest.Mock).mockResolvedValue(mockSession);
      (mockAuthService.refreshSession as jest.Mock).mockResolvedValue(newSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(mockAuthService.refreshSession).toHaveBeenCalled();
    });

    it('should handle refresh error gracefully', async () => {
      (mockAuthService.getSession as jest.Mock).mockResolvedValue(mockSession);
      (mockAuthService.refreshSession as jest.Mock).mockRejectedValue(
        new Error('Refresh failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).not.toBeNull();
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('loginWithOAuth', () => {
    it('should initiate OAuth flow', async () => {
      (mockOauthService.initiateOAuthFlow as jest.Mock).mockResolvedValue({
        authUrl: 'https://oauth.example.com/authorize',
        state: 'test-state',
        codeVerifier: 'test-verifier'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.loginWithOAuth();
      });

      expect(success!).toBe(true);
      expect(mockOauthService.initiateOAuthFlow).toHaveBeenCalled();
    });

    it('should handle OAuth initiation error', async () => {
      (mockOauthService.initiateOAuthFlow as jest.Mock).mockRejectedValue(
        new Error('OAuth failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.loginWithOAuth();
      });

      expect(success!).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback successfully', async () => {
      const callbackUrl = 'oasisbio://callback?code=test-code&state=test-state';

      (mockOauthService.parseOAuthCallback as jest.Mock).mockReturnValue({
        code: 'test-code',
        state: 'test-state',
        error: null
      });

      (mockOauthService.exchangeCodeForTokens as jest.Mock).mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      (mockOauthService.getUserInfo as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        email: 'test@example.com'
      });

      (mockAuthService.storeSession as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.handleOAuthCallback(callbackUrl);
      });

      expect(success!).toBe(true);
      expect(result.current.session).not.toBeNull();
    });

    it('should handle OAuth callback error', async () => {
      const callbackUrl = 'oasisbio://callback?error=access_denied';

      (mockOauthService.parseOAuthCallback as jest.Mock).mockReturnValue({
        code: null,
        state: null,
        error: 'access_denied'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.handleOAuthCallback(callbackUrl);
      });

      expect(success!).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    it('should handle missing callback parameters', async () => {
      const callbackUrl = 'oasisbio://callback';

      (mockOauthService.parseOAuthCallback as jest.Mock).mockReturnValue({
        code: null,
        state: null,
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.handleOAuthCallback(callbackUrl);
      });

      expect(success!).toBe(false);
    });
  });

  describe('isOAuthAvailable', () => {
    it('should return true when OAuth is configured', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isOAuthAvailable).toBe(true);
    });

    it('should return false when OAuth is not configured', async () => {
      delete process.env.VITE_OAUTH_CLIENT_ID;

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isOAuthAvailable).toBe(false);
    });
  });

  describe('useSession', () => {
    it('should return session from context', async () => {
      (mockAuthService.getSession as jest.Mock).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current?.user.email).toBe('test@example.com');
    });
  });

  describe('context validation', () => {
    it('should throw error when useAuth is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });
});
