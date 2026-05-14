import { assistantService } from './assistantService';
import { apiClient } from './api';
import type { ChatRequest, ChatResponse, AgentType } from '../types/assistant';

jest.mock('./api');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AssistantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfiles', () => {
    it('should fetch and return both profiles', async () => {
      const mockDeoProfile = {
        systemPrompt: 'Deo prompt',
        apiEndpoint: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'gpt-4o',
        enabled: true
      };

      const mockDiaProfile = {
        systemPrompt: 'Dia prompt',
        apiEndpoint: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'gpt-4o',
        enabled: true
      };

      (mockApiClient.request as jest.Mock)
        .mockResolvedValueOnce({ data: mockDeoProfile })
        .mockResolvedValueOnce({ data: mockDiaProfile });

      const result = await assistantService.getProfiles();

      expect(result.deo.systemPrompt).toBe('Deo prompt');
      expect(result.deo.configured).toBe(true);
      expect(result.dia.systemPrompt).toBe('Dia prompt');
      expect(result.dia.configured).toBe(true);
    });

    it('should return default profiles on error', async () => {
      (mockApiClient.request as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await assistantService.getProfiles();

      expect(result.deo.configured).toBe(false);
      expect(result.dia.configured).toBe(false);
    });

    it('should handle missing profile data', async () => {
      (mockApiClient.request as jest.Mock)
        .mockResolvedValueOnce({ data: null })
        .mockResolvedValueOnce({ data: null });

      const result = await assistantService.getProfiles();

      expect(result.deo.enabled).toBe(true);
      expect(result.dia.enabled).toBe(true);
    });

    it('should mark profile as not configured when missing endpoint or key', async () => {
      (mockApiClient.request as jest.Mock)
        .mockResolvedValueOnce({ data: { apiEndpoint: null, apiKey: null } })
        .mockResolvedValueOnce({ data: { apiEndpoint: 'url', apiKey: null } });

      const result = await assistantService.getProfiles();

      expect(result.deo.configured).toBe(false);
      expect(result.dia.configured).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update deo profile', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({ success: true });

      await assistantService.updateProfile('deo', { systemPrompt: 'New prompt' });

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.stringContaining('/profiles/deo'),
        'PUT',
        { systemPrompt: 'New prompt' }
      );
    });

    it('should update dia profile', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({ success: true });

      await assistantService.updateProfile('dia', { enabled: false });

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.stringContaining('/profiles/dia'),
        'PUT',
        { enabled: false }
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message and return response', async () => {
      const mockResponse: ChatResponse = {
        sessionId: 'session-1',
        agent: 'deo',
        response: 'Hello! How can I help you?'
      };

      (mockApiClient.request as jest.Mock).mockResolvedValue({ data: mockResponse });

      const request: ChatRequest = {
        message: 'Hello',
        agent: 'deo'
      };

      const result = await assistantService.sendMessage(request);

      expect(result.sessionId).toBe('session-1');
      expect(result.agent).toBe('deo');
      expect(result.response).toBe('Hello! How can I help you?');
    });

    it('should throw error on send failure', async () => {
      (mockApiClient.request as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(
        assistantService.sendMessage({ message: 'Hello' })
      ).rejects.toThrow('API error');
    });

    it('should include session ID in request', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({
        data: { sessionId: 'session-1', agent: 'deo', response: 'OK' }
      });

      await assistantService.sendMessage({
        message: 'Hello',
        sessionId: 'existing-session'
      });

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.any(String),
        'POST',
        expect.objectContaining({
          sessionId: 'existing-session'
        })
      );
    });
  });

  describe('getSessions', () => {
    it('should return list of sessions', async () => {
      const mockSessions = [
        { id: '1', agent: 'deo', title: 'Chat 1', createdAt: new Date(), updatedAt: new Date(), messageCount: 5 },
        { id: '2', agent: 'dia', title: 'Chat 2', createdAt: new Date(), updatedAt: new Date(), messageCount: 3 }
      ];

      (mockApiClient.request as jest.Mock).mockResolvedValue({ data: mockSessions });

      const result = await assistantService.getSessions();

      expect(result).toHaveLength(2);
      expect(result[0].agent).toBe('deo');
      expect(result[1].agent).toBe('dia');
    });

    it('should return empty array on error', async () => {
      (mockApiClient.request as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await assistantService.getSessions();

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({ data: null });

      const result = await assistantService.getSessions();

      expect(result).toEqual([]);
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      const mockSession = {
        id: 'session-1',
        agent: 'deo',
        title: 'Test Session',
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 10
      };

      (mockApiClient.request as jest.Mock).mockResolvedValue({ data: mockSession });

      const result = await assistantService.getSession('session-1');

      expect(result?.id).toBe('session-1');
      expect(result?.agent).toBe('deo');
    });

    it('should return null on error', async () => {
      (mockApiClient.request as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await assistantService.getSession('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({ success: true });

      await assistantService.deleteSession('session-1');

      expect(mockApiClient.request).toHaveBeenCalledWith(
        'DELETE',
        expect.stringContaining('/sessions/session-1')
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages with parsed dates', async () => {
      const mockMessages = [
        { id: '1', role: 'user', content: 'Hello', createdAt: '2024-01-01T10:00:00Z' },
        { id: '2', role: 'deo', content: 'Hi there!', createdAt: '2024-01-01T10:01:00Z' }
      ];

      (mockApiClient.request as jest.Mock).mockResolvedValue({ data: mockMessages });

      const result = await assistantService.getMessages('session-1');

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array on error', async () => {
      (mockApiClient.request as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await assistantService.getMessages('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getPermissions', () => {
    it('should return permissions', async () => {
      const mockPermissions = {
        level: 'admin',
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: true,
          canManageAssistant: true,
          canManageUsers: false,
          canExportData: true
        }
      };

      (mockApiClient.request as jest.Mock).mockResolvedValue({ data: mockPermissions });

      const result = await assistantService.getPermissions();

      expect(result.level).toBe('admin');
      expect(result.permissions.canWrite).toBe(true);
    });

    it('should return default permissions on error', async () => {
      (mockApiClient.request as jest.Mock).mockRejectedValue(new Error('Not authorized'));

      const result = await assistantService.getPermissions();

      expect(result.level).toBe('read');
      expect(result.permissions.canWrite).toBe(false);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({ success: true });

      await assistantService.updatePermissions('write', { canWrite: true });

      expect(mockApiClient.request).toHaveBeenCalledWith(
        'PUT',
        expect.stringContaining('/permissions'),
        { level: 'write', permissions: { canWrite: true } }
      );
    });
  });

  describe('createNewSession', () => {
    it('should create new session and return session ID', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({
        data: { sessionId: 'new-session-id' }
      });

      const result = await assistantService.createNewSession('deo');

      expect(result).toBe('new-session-id');
      expect(mockApiClient.request).toHaveBeenCalledWith(
        'POST',
        expect.stringContaining('/sessions'),
        { agent: 'deo' }
      );
    });

    it('should return empty string when no session ID returned', async () => {
      (mockApiClient.request as jest.Mock).mockResolvedValue({ data: null });

      const result = await assistantService.createNewSession('dia');

      expect(result).toBe('');
    });
  });
});
