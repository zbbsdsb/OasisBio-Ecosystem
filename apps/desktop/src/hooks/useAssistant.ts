'use client';

import { useState, useCallback, useRef } from 'react';
import { assistantService } from '../services/assistantService';
import type { AgentType, AssistantMessage, ChatResponse } from '../types/assistant';

interface UseAssistantOptions {
  sessionId?: string;
  selectedAgent?: AgentType;
  onMessageReceived?: (message: AssistantMessage) => void;
}

interface UseAssistantReturn {
  messages: AssistantMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | undefined;
  sendMessage: (message: string) => Promise<ChatResponse>;
  clearMessages: () => void;
  setSessionId: (id: string | undefined) => void;
  loadMessages: (sessionId: string) => Promise<void>;
}

export function useAssistant(options: UseAssistantOptions = {}): UseAssistantReturn {
  const { sessionId: initialSessionId, selectedAgent: initialAgent = 'deo', onMessageReceived } = options;
  
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionIdState] = useState<string | undefined>(initialSessionId);
  const [currentAgent, setCurrentAgent] = useState<AgentType>(initialAgent);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string): Promise<ChatResponse> => {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    setIsLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await assistantService.sendMessage({
        sessionId: sessionId,
        agent: currentAgent,
        message: message.trim()
      });

      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: response.agent,
        content: response.response,
        createdAt: new Date()
      };

      if (response.sessionId !== sessionId) {
        setSessionIdState(response.sessionId);
      }

      if (response.agent !== currentAgent) {
        setCurrentAgent(response.agent);
      }

      setMessages(prev => [...prev, assistantMessage]);
      
      onMessageReceived?.(assistantMessage);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentAgent, onMessageReceived]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const setSessionId = useCallback((id: string | undefined) => {
    setSessionIdState(id);
    setMessages([]);
    setError(null);
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedMessages = await assistantService.getMessages(id);
      setMessages(loadedMessages);
      setSessionIdState(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    clearMessages,
    setSessionId,
    loadMessages
  };
}

export default useAssistant;
