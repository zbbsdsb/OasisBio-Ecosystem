import { apiClient } from './api';
import { cacheService } from './cache';
import * as auth from './auth';

jest.mock('./auth');
jest.mock('./cache');

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'ACTIVE' as any,
    metadata: {}
  },
  profile: {
    id: 'test-user-id',
    userId: 'test-user-id',
    displayName: 'Test User',
    avatarUrl: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {}
  },
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: new Date(Date.now() + 3600000)
};

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth.getSession as jest.Mock).mockResolvedValue(mockSession);
    (cacheService.get as jest.Mock).mockReturnValue(null);
    (cacheService.set as jest.Mock).mockReturnValue(undefined);
    (cacheService.delete as jest.Mock).mockReturnValue(undefined);
    (cacheService.clear as jest.Mock).mockReturnValue(undefined);
  });

  describe('request method', () => {
    it('should make GET request with authorization header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test', success: true })
      });

      await apiClient.profile.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1' }, success: true })
      });

      await apiClient.auth.loginWithOtp({ email: 'test@example.com' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login-otp'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' })
        })
      );
    });

    it('should return cached data for GET requests', async () => {
      const cachedData = { data: { id: 'cached' }, success: true };
      (cacheService.get as jest.Mock).mockReturnValue(cachedData);

      const result = await apiClient.profile.getProfile();

      expect(result).toEqual(cachedData);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip cache when skipCache option is true', async () => {
      const cachedData = { data: { id: 'cached' }, success: true };
      (cacheService.get as jest.Mock).mockReturnValue(cachedData);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'fresh' }, success: true })
      });

      await apiClient.auth.loginWithOtp({ email: 'test@example.com' });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Not found' })
      });

      await expect(apiClient.profile.getProfile()).rejects.toThrow('Not found');
    });

    it('should return cached data on network error for GET requests', async () => {
      const cachedData = { data: { id: 'cached' }, success: true };
      (cacheService.get as jest.Mock).mockReturnValue(cachedData);

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiClient.profile.getProfile();

      expect(result).toEqual(cachedData);
    });

    it('should throw error on network error for non-GET requests', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        apiClient.oasisBios.create({ name: 'Test' } as any)
      ).rejects.toThrow('Network error');
    });

    it('should work without session', async () => {
      (auth.getSession as jest.Mock).mockResolvedValue(null);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test', success: true })
      });

      await apiClient.profile.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything()
          })
        })
      );
    });
  });

  describe('auth endpoints', () => {
    it('should call loginWithOtp endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await apiClient.auth.loginWithOtp({ email: 'test@example.com' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login-otp'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call verifyOtp endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { session: {} }, success: true })
      });

      await apiClient.auth.verifyOtp({ email: 'test@example.com', token: '123456' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/verify-otp'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should clear cache on logout', async () => {
      await apiClient.auth.logout();
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });

  describe('profile endpoints', () => {
    it('should get profile', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: {}, profile: {} }, success: true })
      });

      const result = await apiClient.profile.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profile'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should update profile and invalidate cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {}, success: true })
      });

      await apiClient.profile.updateProfile({ displayName: 'New Name' } as any);

      expect(cacheService.delete).toHaveBeenCalledWith('profile');
    });
  });

  describe('oasisBios endpoints', () => {
    it('should list oasisBios', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], success: true })
      });

      await apiClient.oasisBios.list();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/oasisbios'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should create oasisBio and invalidate cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1' }, success: true })
      });

      await apiClient.oasisBios.create({ name: 'Test' } as any);

      expect(cacheService.delete).toHaveBeenCalledWith('oasisbios-list');
    });

    it('should get oasisBio by id', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1' }, success: true })
      });

      await apiClient.oasisBios.getById('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/oasisbios/1'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should update oasisBio and invalidate caches', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1' }, success: true })
      });

      await apiClient.oasisBios.update('1', { name: 'Updated' } as any);

      expect(cacheService.delete).toHaveBeenCalledWith('oasisbios-list');
      expect(cacheService.delete).toHaveBeenCalledWith('oasisbio-1');
    });

    it('should delete oasisBio', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await apiClient.oasisBios.delete('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/oasisbios/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('abilities endpoints', () => {
    it('should list abilities by oasisBioId', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], success: true })
      });

      await apiClient.abilities.listByOasisBioId('bio-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/oasisbios/bio-1/abilities'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should create ability', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1' }, success: true })
      });

      await apiClient.abilities.create('bio-1', { name: 'Ability' } as any);

      expect(cacheService.delete).toHaveBeenCalledWith('abilities-bio-1');
    });
  });

  describe('worlds endpoints', () => {
    it('should list worlds by oasisBioId', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], success: true })
      });

      await apiClient.worlds.listByOasisBioId('bio-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/oasisbios/bio-1/worlds'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get world by id', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1' }, success: true })
      });

      await apiClient.worlds.getById('world-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/worlds/world-1'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should list world documents', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], success: true })
      });

      await apiClient.worlds.listDocuments('world-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/worlds/world-1/documents'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('settings endpoints', () => {
    it('should get settings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {}, success: true })
      });

      await apiClient.settings.getSettings();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/settings'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should update settings and invalidate cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {}, success: true })
      });

      await apiClient.settings.updateSettings({ theme: 'dark' } as any);

      expect(cacheService.delete).toHaveBeenCalledWith('settings');
    });
  });

  describe('dashboard endpoints', () => {
    it('should get dashboard data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {}, success: true })
      });

      await apiClient.dashboard.getDashboard();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});
