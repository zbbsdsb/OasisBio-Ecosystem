import { renderHook, act, waitFor } from '@testing-library/react';
import { useAssistant } from './useAssistant';
import { assistantService } from '../services/assistantService';
import type { ChatResponse, AssistantMessage, AgentType } from '../types/assistant';

jest.mock('../services/assistantService');

const mockAssistantService = assistantService as jest.Mocked<typeof assistantService>;

describe('useAssistant Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty messages', () => {
      const { result } = renderHook(() => useAssistant());

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.sessionId).toBeUndefined();
    });

    it('should initialize with provided session ID', () => {
      const { result } = renderHook(() =>
        useAssistant({ sessionId: 'existing-session' })
      );

      expect(result.current.sessionId).toBe('existing-session');
    });

    it('should initialize with provided agent', () => {
      const { result } = renderHook(() =>
        useAssistant({ selectedAgent: 'dia' })
      );

      expect(result.current.messages).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('should send message and update messages', async () => {
      const mockResponse: ChatResponse = {
        sessionId: 'session-1',
        agent: 'deo',
        response: 'Hello! How can I help you?'
      };

      mockAssistantService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[1].role).toBe('deo');
      expect(result.current.messages[1].content).toBe('Hello! How can I help you?');
    });

    it('should update session ID from response', async () => {
      const mockResponse: ChatResponse = {
        sessionId: 'new-session-id',
        agent: 'deo',
        response: 'Response'
      };

      mockAssistantService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.sessionId).toBe('new-session-id');
    });

    it('should set loading state during send', async () => {
      let resolveSend: (value: ChatResponse) => void;
      mockAssistantService.sendMessage.mockImplementation(
        () =>
          new Promise<ChatResponse>((resolve) => {
            resolveSend = resolve;
          })
      );

      const { result } = renderHook(() => useAssistant());

      const sendPromise = act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSend!({
          sessionId: 'session-1',
          agent: 'deo',
          response: 'Response'
        });
      });

      await sendPromise;

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle send error', async () => {
      mockAssistantService.sendMessage.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        try {
          await result.current.sendMessage('Hello');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.messages).toHaveLength(0);
    });

    it('should remove user message on error', async () => {
      mockAssistantService.sendMessage.mockRejectedValue(
        new Error('Failed to send')
      );

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        try {
          await result.current.sendMessage('Hello');
        } catch (error) {}
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should throw error for empty message', async () => {
      const { result } = renderHook(() => useAssistant());

      await expect(
        act(async () => {
          await result.current.sendMessage('');
        })
      ).rejects.toThrow('Message cannot be empty');
    });

    it('should trim whitespace from message', async () => {
      mockAssistantService.sendMessage.mockResolvedValue({
        sessionId: 'session-1',
        agent: 'deo',
        response: 'Response'
      });

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.sendMessage('  Hello World  ');
      });

      expect(result.current.messages[0].content).toBe('Hello World');
      expect(mockAssistantService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Hello World'
        })
      );
    });

    it('should call onMessageReceived callback', async () => {
      const onMessageReceived = jest.fn();
      const mockResponse: ChatResponse = {
        sessionId: 'session-1',
        agent: 'deo',
        response: 'Response'
      };

      mockAssistantService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useAssistant({ onMessageReceived })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onMessageReceived).toHaveBeenCalled();
      expect(onMessageReceived).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'deo',
          content: 'Response'
        })
      );
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', async () => {
      mockAssistantService.sendMessage.mockResolvedValue({
        sessionId: 'session-1',
        agent: 'deo',
        response: 'Response'
      });

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useAssistant());

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setSessionId', () => {
    it('should update session ID', () => {
      const { result } = renderHook(() => useAssistant());

      act(() => {
        result.current.setSessionId('new-session');
      });

      expect(result.current.sessionId).toBe('new-session');
    });

    it('should clear messages when session changes', async () => {
      mockAssistantService.sendMessage.mockResolvedValue({
        sessionId: 'session-1',
        agent: 'deo',
        response: 'Response'
      });

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.setSessionId('different-session');
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should clear error when session changes', () => {
      const { result } = renderHook(() => useAssistant());

      act(() => {
        result.current.setSessionId('new-session');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('loadMessages', () => {
    it('should load messages from service', async () => {
      const mockMessages: AssistantMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          role: 'deo',
          content: 'Hi there!',
          createdAt: new Date('2024-01-01')
        }
      ];

      mockAssistantService.getMessages.mockResolvedValue(mockMessages);

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.loadMessages('session-1');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.sessionId).toBe('session-1');
    });

    it('should set loading state during load', async () => {
      let resolveLoad: (value: AssistantMessage[]) => void;
      mockAssistantService.getMessages.mockImplementation(
        () =>
          new Promise<AssistantMessage[]>((resolve) => {
            resolveLoad = resolve;
          })
      );

      const { result } = renderHook(() => useAssistant());

      const loadPromise = act(async () => {
        await result.current.loadMessages('session-1');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLoad!([]);
      });

      await loadPromise;

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle load error', async () => {
      mockAssistantService.getMessages.mockRejectedValue(
        new Error('Failed to load')
      );

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.loadMessages('session-1');
      });

      expect(result.current.error).toBe('Failed to load');
    });

    it('should handle empty messages', async () => {
      mockAssistantService.getMessages.mockResolvedValue([]);

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.loadMessages('session-1');
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('multiple messages', () => {
    it('should accumulate multiple messages', async () => {
      mockAssistantService.sendMessage
        .mockResolvedValueOnce({
          sessionId: 'session-1',
          agent: 'deo',
          response: 'First response'
        })
        .mockResolvedValueOnce({
          sessionId: 'session-1',
          agent: 'deo',
          response: 'Second response'
        });

      const { result } = renderHook(() => useAssistant());

      await act(async () => {
        await result.current.sendMessage('First');
      });

      await act(async () => {
        await result.current.sendMessage('Second');
      });

      expect(result.current.messages).toHaveLength(4);
      expect(result.current.messages[0].content).toBe('First');
      expect(result.current.messages[1].content).toBe('First response');
      expect(result.current.messages[2].content).toBe('Second');
      expect(result.current.messages[3].content).toBe('Second response');
    });
  });

  describe('agent switching', () => {
    it('should handle agent change in response', async () => {
      mockAssistantService.sendMessage.mockResolvedValue({
        sessionId: 'session-1',
        agent: 'dia',
        response: 'Dia response'
      });

      const { result } = renderHook(() =>
        useAssistant({ selectedAgent: 'deo' })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages[1].role).toBe('dia');
    });
  });
});
