'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useTransition } from 'react';
import { Send, User, Sparkles, Zap, Palette } from 'lucide-react';
import type { AgentType, AssistantMessage } from '../../types/assistant';
import { agentColors } from '../../types/assistant';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  sessionId?: string;
  messages?: AssistantMessage[];
  onSendMessage: (message: string, sessionId?: string) => Promise<{
    sessionId: string;
    agent: AgentType;
    response: string;
  }>;
  selectedAgent?: AgentType;
  onAgentChange?: (agent: AgentType) => void;
}

export const ChatInterface = memo(function ChatInterface({
  sessionId: initialSessionId,
  messages: initialMessages = [],
  onSendMessage,
  selectedAgent = 'deo',
  onAgentChange
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, startTransition] = useTransition();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const result = await onSendMessage(userMessage, sessionId);

      if (result.sessionId !== sessionId) {
        setSessionId(result.sessionId);
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'user',
          content: userMessage,
          createdAt: new Date()
        },
        {
          id: (Date.now() + 1).toString(),
          role: result.agent,
          content: result.response,
          createdAt: new Date()
        }
      ]);

      if (onAgentChange && result.agent !== selectedAgent) {
        startTransition(() => {
          onAgentChange(result.agent);
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getAgentAvatar = (role: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };
    
    if (role === 'deo') {
      return (
        <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20 overflow-hidden`}>
          <img 
            src="/assets/deo/deo.png" 
            alt="Deo" 
            className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'} object-cover`}
            width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
            height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
          />
        </div>
      );
    }
    if (role === 'dia') {
      return (
        <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/20 overflow-hidden`}>
          <img 
            src="/assets/deo/dia.png" 
            alt="Dia" 
            className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'} object-cover`}
            width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
            height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
          />
        </div>
      );
    }
    return (
      <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center shadow-lg shadow-slate-500/10 ring-2 ring-slate-500/20`}>
        <User className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} text-slate-600`} />
      </div>
    );
  };

  const getCurrentAgentColors = () => {
    return agentColors[selectedAgent];
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${getCurrentAgentColors().primary} shadow-lg`}>
              {selectedAgent === 'deo' ? (
                <Zap className="w-5 h-5 text-white" />
              ) : (
                <Palette className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 tracking-tight">
                {selectedAgent === 'deo' ? 'Deo Assistant' : 'Dia Assistant'}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedAgent === 'deo' 
                  ? 'Your technical guide to code and configuration' 
                  : 'Your creative partner for inspiration and worldbuilding'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth"
        style={{
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.03) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(244, 114, 182, 0.03) 0%, transparent 20%)'
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-pink-400/20 rounded-full blur-3xl scale-150" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-100 via-white to-pink-100 rounded-full flex items-center justify-center shadow-xl ring-8 ring-white">
                <Sparkles className="w-10 h-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-pink-500" />
              </div>
            </div>
            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                Start a Conversation
              </h3>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                {selectedAgent === 'deo'
                  ? 'Deo is ready to help with code, configurations, and technical guidance.'
                  : 'Dia is here to spark creativity, offer emotional support, and inspire your worldbuilding.'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <img src="/assets/deo/deo.png" alt="Deo" className="w-5 h-5 rounded-full" />
                <span className="text-sm font-medium text-slate-700">Deo</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <img src="/assets/deo/dia.png" alt="Dia" className="w-5 h-5 rounded-full" />
                <span className="text-sm font-medium text-slate-700">Dia</span>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className="animate-fade-in"
            style={{
              animation: 'fadeInUp 0.4s ease-out',
              animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
              animationFillMode: 'both'
            }}
          >
            <MessageBubble
              role={message.role}
              content={message.content}
              timestamp={message.createdAt}
            />
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 items-end">
            {getAgentAvatar(selectedAgent, 'md')}
            <div className={`max-w-[75%] px-5 py-4 rounded-2xl shadow-lg backdrop-blur-sm border bg-gradient-to-br ${getCurrentAgentColors().secondary} ${getCurrentAgentColors().border}`}>
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedAgent === 'deo' ? 'bg-emerald-400' : 'bg-rose-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                  <span className={`w-2 h-2 rounded-full ${selectedAgent === 'deo' ? 'bg-emerald-400' : 'bg-rose-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                  <span className={`w-2 h-2 rounded-full ${selectedAgent === 'deo' ? 'bg-emerald-400' : 'bg-rose-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedAgent === 'deo' ? 'Deo' : 'Dia'}…`}
              className="w-full px-5 py-4 pr-14 bg-slate-100 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all resize-none overflow-hidden max-h-[200px] text-sm leading-relaxed"
              disabled={isLoading}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-4 rounded-2xl bg-gradient-to-br ${getCurrentAgentColors().primary} text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-xl`}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-3">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInUp 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
});

export default ChatInterface;
