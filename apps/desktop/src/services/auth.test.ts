import {
  sendOtp,
  verifyOtp,
  signOut,
  refreshSession,
  getSession,
  storeSession,
  getSupabaseClient
} from './auth';
import type { AuthSession } from '@oasisbio/common-auth';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn()
    }
  }))
}));

const mockSupabaseClient = {
  auth: {
    signInWithOtp: jest.fn(),
    verifyOtp: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn()
  }
};

jest.mock('./auth', () => {
  const originalModule = jest.requireActual('./auth');
  return {
    ...originalModule,
    getSupabaseClient: () => mockSupabaseClient
  };
});

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

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    delete (window as any).ipcRenderer;
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: null });

      await expect(sendOtp('test@example.com')).resolves.not.toThrow();
      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: { shouldCreateUser: true }
      });
    });

    it('should throw error when send OTP fails', async () => {
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        error: { message: 'Failed to send OTP' }
      });

      await expect(sendOtp('test@example.com')).rejects.toThrow('Failed to send OTP');
    });

    it('should handle empty email', async () => {
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        error: { message: 'Email is required' }
      });

      await expect(sendOtp('')).rejects.toThrow('Email is required');
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return session', async () => {
      const mockSupabaseSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          user_metadata: {}
        },
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600
      };

      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: { session: mockSupabaseSession },
        error: null
      });

      const result = await verifyOtp('test@example.com', '123456');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test-access-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error when OTP is invalid', async () => {
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid OTP' }
      });

      await expect(verifyOtp('test@example.com', 'wrong-code')).rejects.toThrow('Invalid OTP');
    });

    it('should throw error when session is null', async () => {
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(verifyOtp('test@example.com', '123456')).rejects.toThrow('Invalid OTP');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      await expect(signOut()).resolves.not.toThrow();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should clear stored session after sign out', async () => {
      localStorage.setItem('oasisbio-session', JSON.stringify(mockSession));
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      await signOut();

      expect(localStorage.getItem('oasisbio-session')).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const mockSupabaseSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          user_metadata: {}
        },
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      };

      localStorage.setItem('oasisbio-session', JSON.stringify({
        ...mockSession,
        refreshToken: 'test-refresh-token'
      }));

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSupabaseSession },
        error: null
      });

      const result = await refreshSession();

      expect(result).toBeDefined();
      expect(result?.accessToken).toBe('new-access-token');
    });

    it('should return null when no stored session', async () => {
      const result = await refreshSession();
      expect(result).toBeNull();
    });

    it('should return null and clear session on refresh error', async () => {
      localStorage.setItem('oasisbio-session', JSON.stringify({
        ...mockSession,
        refreshToken: 'test-refresh-token'
      }));

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' }
      });

      const result = await refreshSession();

      expect(result).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return stored session if valid', async () => {
      const validSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
      localStorage.setItem('oasisbio-session', JSON.stringify(validSession));

      const result = await getSession();

      expect(result).toBeDefined();
      expect(result?.accessToken).toBe('test-access-token');
    });

    it('should return null when no stored session', async () => {
      const result = await getSession();
      expect(result).toBeNull();
    });

    it('should refresh expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        refreshToken: 'test-refresh-token'
      };
      localStorage.setItem('oasisbio-session', JSON.stringify(expiredSession));

      const mockSupabaseSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          user_metadata: {}
        },
        access_token: 'refreshed-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      };

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSupabaseSession },
        error: null
      });

      const result = await getSession();

      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
    });
  });

  describe('storeSession', () => {
    it('should store session in localStorage', async () => {
      await storeSession(mockSession);

      const stored = localStorage.getItem('oasisbio-session');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).accessToken).toBe('test-access-token');
    });

    it('should use ipcRenderer when available', async () => {
      const mockIpcRenderer = {
        invoke: jest.fn().mockResolvedValue(undefined)
      };
      (window as any).ipcRenderer = mockIpcRenderer;

      await storeSession(mockSession);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'auth:store-session',
        JSON.stringify(mockSession)
      );
    });

    it('should handle storage errors gracefully', async () => {
      const mockSetItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      Object.defineProperty(window, 'localStorage', {
        value: { setItem: mockSetItem, getItem: jest.fn() },
        writable: true
      });

      await expect(storeSession(mockSession)).resolves.not.toThrow();
    });
  });

  describe('getSupabaseClient', () => {
    it('should throw error when Supabase config is missing', () => {
      const originalEnv = process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_URL;

      expect(() => {
        const freshModule = jest.requireActual('./auth');
        freshModule.getSupabaseClient();
      }).toThrow('Missing Supabase configuration');

      process.env.VITE_SUPABASE_URL = originalEnv;
    });
  });
});
