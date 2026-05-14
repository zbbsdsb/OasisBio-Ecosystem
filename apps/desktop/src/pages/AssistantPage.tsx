'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Settings, Plus, History, Trash2, Loader2 } from 'lucide-react';
import { AgentSelector, ChatInterface } from '../components/assistant';
import { useAssistant, useAssistantSessions } from '../hooks';
import type { AgentType, ChatResponse } from '../types/assistant';
import { Spinner } from '../components/ui';

function AssistantPageContent() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('deo');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const { messages, isLoading, error, sendMessage, clearMessages } = useAssistant({
    sessionId: currentSessionId,
    selectedAgent
  });
  const { sessions, isLoading: isSessionsLoading, deleteSession, createSession, refreshSessions } = useAssistantSessions();

  const handleSendMessage = useCallback(async (message: string, sessionId?: string): Promise<ChatResponse> => {
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      targetSessionId = await createSession(selectedAgent);
      setCurrentSessionId(targetSessionId);
    }
    return sendMessage(message);
  }, [selectedAgent, sendMessage, createSession]);

  const handleNewChat = useCallback(async () => {
    clearMessages();
    setCurrentSessionId(undefined);
  }, [clearMessages]);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        clearMessages();
        setCurrentSessionId(undefined);
      }
    }
  }, [deleteSession, currentSessionId, clearMessages]);

  const formatSessionDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} />
              Chats
            </h2>
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="New Chat"
            >
              <Plus size={20} className="text-slate-600" />
            </button>
          </div>
          <button
            onClick={() => navigate('/assistant/settings')}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700"
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    currentSessionId === session.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    session.agent === 'deo'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}>
                    {session.agent === 'deo' ? (
                      <img src="/assets/deo/deo.png" alt="Deo" className="w-5 h-5 rounded" />
                    ) : (
                      <img src="/assets/deo/dia.png" alt="Dia" className="w-5 h-5 rounded" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {session.title || `${session.agent === 'deo' ? 'Deo' : 'Dia'} Chat`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatSessionDate(session.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 bg-slate-50">
        <div className="mb-4">
          <AgentSelector selectedAgent={selectedAgent} onAgentChange={setSelectedAgent} />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0">
          <ChatInterface
            sessionId={currentSessionId}
            messages={messages}
            onSendMessage={handleSendMessage}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
        </div>
      </div>
    </div>
  );
}

export const AssistantPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
};

export default AssistantPage;
