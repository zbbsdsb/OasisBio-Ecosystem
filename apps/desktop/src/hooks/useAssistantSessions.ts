'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { assistantService } from '../services/assistantService';
import type { AgentType, AssistantSession } from '../types/assistant';

const STORAGE_KEY = 'oasisbio_assistant_sessions';
const MESSAGES_STORAGE_KEY = 'oasisbio_assistant_messages';

interface StoredSession extends Omit<AssistantSession, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

interface UseAssistantSessionsReturn {
  sessions: AssistantSession[];
  isLoading: boolean;
  error: string | null;
  createSession: (agent: AgentType) => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  getSession: (sessionId: string) => AssistantSession | undefined;
  getSessionHistory: (sessionId: string) => { role: 'user' | AgentType; content: string; createdAt: Date }[];
  saveSessionHistory: (sessionId: string, messages: { role: 'user' | AgentType; content: string; createdAt: Date }[]) => void;
  clearSessionHistory: (sessionId: string) => void;
}

function serializeSession(session: AssistantSession): StoredSession {
  return {
    ...session,
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : session.createdAt,
    updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : session.updatedAt,
  };
}

function deserializeSession(session: StoredSession): AssistantSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  };
}

function loadSessionsFromStorage(): StoredSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions: StoredSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
}

function loadMessagesFromStorage(sessionId: string): { role: 'user' | AgentType; content: string; createdAt: string }[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${MESSAGES_STORAGE_KEY}_${sessionId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessagesToStorage(sessionId: string, messages: { role: 'user' | AgentType; content: string; createdAt: Date }[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${MESSAGES_STORAGE_KEY}_${sessionId}`;
    const serialized = messages.map(m => ({
      ...m,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    }));
    localStorage.setItem(key, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
}

function clearMessagesFromStorage(sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${MESSAGES_STORAGE_KEY}_${sessionId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear messages from localStorage:', error);
  }
}

export function useAssistantSessions(): UseAssistantSessionsReturn {
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const remoteSessions = await assistantService.getSessions();
      const localSessions = loadSessionsFromStorage();
      
      const localMap = new Map(localSessions.map(s => [s.id, s]));
      const mergedSessions = remoteSessions.map(remote => {
        const local = localMap.get(remote.id);
        if (local) {
          localMap.delete(remote.id);
          return deserializeSession({
            ...local,
            ...remote,
            createdAt: remote.createdAt instanceof Date ? remote.createdAt.toISOString() : remote.createdAt,
            updatedAt: remote.updatedAt instanceof Date ? remote.updatedAt.toISOString() : remote.updatedAt,
          });
        }
        return remote;
      });
      
      const allSessions = [...mergedSessions, ...Array.from(localMap.values()).map(deserializeSession)];
      
      const sortedSessions = allSessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setSessions(sortedSessions);
      saveSessionsToStorage(sortedSessions.map(serializeSession));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errorMessage);
      const cached = loadSessionsFromStorage();
      if (cached.length > 0) {
        setSessions(cached.map(deserializeSession));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(async (agent: AgentType): Promise<string> => {
    try {
      const sessionId = await assistantService.createNewSession(agent);
      await loadSessions();
      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    }
  }, [loadSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await assistantService.deleteSession(sessionId);
      clearMessagesFromStorage(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      saveSessionsToStorage(sessions.filter(s => s.id !== sessionId).map(serializeSession));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      throw err;
    }
  }, [sessions]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, title: newTitle, updatedAt: new Date() } : s
      );
      saveSessionsToStorage(updated.map(serializeSession));
      return updated;
    });
  }, []);

  const getSession = useCallback((sessionId: string): AssistantSession | undefined => {
    return sessions.find(s => s.id === sessionId);
  }, [sessions]);

  const getSessionHistory = useCallback((sessionId: string): { role: 'user' | AgentType; content: string; createdAt: Date }[] => {
    const stored = loadMessagesFromStorage(sessionId);
    return stored.map(m => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));
  }, []);

  const saveSessionHistory = useCallback((sessionId: string, messages: { role: 'user' | AgentType; content: string; createdAt: Date }[]) => {
    saveMessagesToStorage(sessionId, messages);
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, messageCount: messages.length, updatedAt: new Date() } : s
      );
      saveSessionsToStorage(updated.map(serializeSession));
      return updated;
    });
  }, []);

  const clearSessionHistory = useCallback((sessionId: string) => {
    clearMessagesFromStorage(sessionId);
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, messageCount: 0, updatedAt: new Date() } : s
      );
      saveSessionsToStorage(updated.map(serializeSession));
      return updated;
    });
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return useMemo(() => ({
    sessions,
    isLoading,
    error,
    createSession,
    deleteSession,
    renameSession,
    refreshSessions: loadSessions,
    getSession,
    getSessionHistory,
    saveSessionHistory,
    clearSessionHistory,
  }), [sessions, isLoading, error, createSession, deleteSession, renameSession, loadSessions, getSession, getSessionHistory, saveSessionHistory, clearSessionHistory]);
}

export default useAssistantSessions;
