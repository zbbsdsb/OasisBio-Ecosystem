import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { customRender, createMockSession, createMockAssistantSession, flushPromises } from '../test-utils'
import { AssistantPage } from '../../pages/AssistantPage'
import { AgentSelector } from '../../components/assistant/AgentSelector'
import { ChatInterface } from '../../components/assistant/ChatInterface'
import { useAssistant, useAssistantSessions } from '../../hooks'
import type { AgentType, AssistantMessage, ChatResponse } from '../../types/assistant'
import { server, createMockAssistantState, createAssistantHandlers, resetHandlers } from '../mocks/server'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AI Assistant Chat Integration Tests', () => {
  let assistantState: ReturnType<typeof createMockAssistantState>

  beforeAll(() => {
    server.listen()
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    assistantState = createMockAssistantState()
    resetHandlers()
    mockNavigate.mockClear()
  })

  describe('Agent Selection', () => {
    function AgentSelectorTestWrapper() {
      const [selectedAgent, setSelectedAgent] = React.useState<AgentType>('deo')
      return (
        <div>
          <AgentSelector selectedAgent={selectedAgent} onAgentChange={setSelectedAgent} />
          <div data-testid="current-agent">{selectedAgent}</div>
        </div>
      )
    }

    it('should display both Deo and Dia agents', async () => {
      customRender(<AgentSelectorTestWrapper />)

      expect(screen.getByText(/deo/i) || screen.getByAltText(/deo/i)).toBeInTheDocument()
      expect(screen.getByText(/dia/i) || screen.getByAltText(/dia/i)).toBeInTheDocument()
    })

    it('should select Deo by default', async () => {
      customRender(<AgentSelectorTestWrapper />)

      expect(screen.getByTestId('current-agent')).toHaveTextContent('deo')
    })

    it('should switch to Dia when clicked', async () => {
      const user = userEvent.setup()
      
      customRender(<AgentSelectorTestWrapper />)

      const diaButton = screen.getByRole('button', { name: /dia/i }) || 
        screen.getByText(/dia/i).closest('button')
      
      if (diaButton) {
        await user.click(diaButton)
        
        await waitFor(() => {
          expect(screen.getByTestId('current-agent')).toHaveTextContent('dia')
        })
      }
    })

    it('should visually indicate selected agent', async () => {
      customRender(<AgentSelectorTestWrapper />)

      const deoElement = screen.getByText(/deo/i) || screen.getByAltText(/deo/i)
      expect(deoElement.closest('button') || deoElement).toHaveClass(/selected|active|ring|border/)
    })
  })

  describe('Message Sending', () => {
    function ChatTestWrapper({ initialMessages = [] }: { initialMessages?: AssistantMessage[] }) {
      const [messages, setMessages] = React.useState<AssistantMessage[]>(initialMessages)
      const [isLoading, setIsLoading] = React.useState(false)
      const [error, setError] = React.useState<string | null>(null)
      const [sessionId, setSessionId] = React.useState<string | undefined>()

      const handleSendMessage = async (message: string): Promise<ChatResponse> => {
        setIsLoading(true)
        setError(null)
        
        try {
          const response = await fetch('/api/assistants/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, agent: 'deo', message }),
          })
          
          const data = await response.json()
          
          setMessages(prev => [
            ...prev,
            { id: `user-${Date.now()}`, role: 'user', content: message, createdAt: new Date() },
            { id: `assistant-${Date.now()}`, role: data.agent, content: data.response, createdAt: new Date() },
          ])
          
          if (!sessionId) {
            setSessionId(data.sessionId)
          }
          
          return data
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to send message')
          throw err
        } finally {
          setIsLoading(false)
        }
      }

      return (
        <div>
          <ChatInterface
            sessionId={sessionId}
            messages={messages}
            onSendMessage={handleSendMessage}
            selectedAgent="deo"
            onAgentChange={() => {}}
          />
          {isLoading && <div data-testid="loading">loading</div>}
          {error && <div data-testid="error">{error}</div>}
        </div>
      )
    }

    it('should send a message and receive a response', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<ChatTestWrapper />)

      const messageInput = screen.getByPlaceholderText(/输入消息|type a message/i) ||
        screen.getByRole('textbox')
      
      await user.type(messageInput, 'Hello, Deo!')
      
      const sendButton = screen.getByRole('button', { name: /发送|send/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Hello, Deo!')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/hello|help/i)).toBeInTheDocument()
      })
    })

    it('should show loading state while waiting for response', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<ChatTestWrapper />)

      const messageInput = screen.getByPlaceholderText(/输入消息|type a message/i) ||
        screen.getByRole('textbox')
      
      await user.type(messageInput, 'Test message')
      
      const sendButton = screen.getByRole('button', { name: /发送|send/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })
    })

    it('should display error when message fails to send', async () => {
      const user = userEvent.setup()
      
      server.use(
        ...createAssistantHandlers(assistantState),
        rest.post('*/api/assistants/chat', async (_, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }))
        })
      )

      customRender(<ChatTestWrapper />)

      const messageInput = screen.getByPlaceholderText(/输入消息|type a message/i) ||
        screen.getByRole('textbox')
      
      await user.type(messageInput, 'Test message')
      
      const sendButton = screen.getByRole('button', { name: /发送|send/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument()
      })
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<ChatTestWrapper />)

      const sendButton = screen.getByRole('button', { name: /发送|send/i })
      await user.click(sendButton)

      expect(screen.queryByText(/hello/i)).not.toBeInTheDocument()
    })

    it('should disable send button while loading', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<ChatTestWrapper />)

      const messageInput = screen.getByPlaceholderText(/输入消息|type a message/i) ||
        screen.getByRole('textbox')
      
      await user.type(messageInput, 'Test message')
      
      const sendButton = screen.getByRole('button', { name: /发送|send/i })
      await user.click(sendButton)

      await waitFor(() => {
        expect(sendButton).toBeDisabled()
      })
    })
  })

  describe('Session Management', () => {
    function SessionsTestWrapper() {
      const [sessions, setSessions] = React.useState<ReturnType<typeof createMockAssistantSession>[]>([])
      const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null)
      const [isLoading, setIsLoading] = React.useState(false)

      const loadSessions = async () => {
        setIsLoading(true)
        try {
          const response = await fetch('/api/assistants/sessions')
          const data = await response.json()
          setSessions(data)
        } finally {
          setIsLoading(false)
        }
      }

      const deleteSession = async (sessionId: string) => {
        await fetch(`/api/assistants/sessions/${sessionId}`, { method: 'DELETE' })
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      }

      React.useEffect(() => {
        loadSessions()
      }, [])

      return (
        <div>
          <button onClick={loadSessions} data-testid="refresh-sessions">Refresh</button>
          {isLoading && <div data-testid="loading">Loading</div>}
          <ul data-testid="sessions-list">
            {sessions.map(session => (
              <li key={session.id} data-testid={`session-${session.id}`}>
                <span>{session.title}</span>
                <button onClick={() => setCurrentSessionId(session.id)}>Select</button>
                <button onClick={() => deleteSession(session.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <div data-testid="current-session">{currentSessionId || 'none'}</div>
        </div>
      )
    }

    it('should load sessions on mount', async () => {
      assistantState.sessions = [
        createMockAssistantSession({ id: 'session-1', title: 'Chat 1' }),
        createMockAssistantSession({ id: 'session-2', title: 'Chat 2' }),
      ]
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<SessionsTestWrapper />)

      await waitFor(() => {
        expect(screen.getByTestId('session-session-1')).toBeInTheDocument()
        expect(screen.getByTestId('session-session-2')).toBeInTheDocument()
      })
    })

    it('should create a new session when sending first message', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAssistantHandlers(assistantState))

      function NewSessionTestWrapper() {
        const [sessionId, setSessionId] = React.useState<string | null>(null)

        const sendMessage = async () => {
          const response = await fetch('/api/assistants/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent: 'deo', message: 'Hello' }),
          })
          const data = await response.json()
          setSessionId(data.sessionId)
        }

        return (
          <div>
            <button onClick={sendMessage} data-testid="send-message">Send</button>
            <div data-testid="session-id">{sessionId || 'none'}</div>
          </div>
        )
      }

      customRender(<NewSessionTestWrapper />)

      const sendButton = screen.getByTestId('send-message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).not.toHaveTextContent('none')
      })
    })

    it('should delete a session', async () => {
      const user = userEvent.setup()
      
      assistantState.sessions = [
        createMockAssistantSession({ id: 'session-1', title: 'Chat 1' }),
      ]
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<SessionsTestWrapper />)

      await waitFor(() => {
        expect(screen.getByTestId('session-session-1')).toBeInTheDocument()
      })

      const deleteButton = within(screen.getByTestId('session-session-1')).getByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByTestId('session-session-1')).not.toBeInTheDocument()
      })
    })

    it('should select a session', async () => {
      const user = userEvent.setup()
      
      assistantState.sessions = [
        createMockAssistantSession({ id: 'session-1', title: 'Chat 1' }),
      ]
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<SessionsTestWrapper />)

      await waitFor(() => {
        expect(screen.getByTestId('session-session-1')).toBeInTheDocument()
      })

      const selectButton = within(screen.getByTestId('session-session-1')).getByText('Select')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-session')).toHaveTextContent('session-1')
      })
    })

    it('should refresh sessions list', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAssistantHandlers(assistantState))

      customRender(<SessionsTestWrapper />)

      assistantState.sessions = [
        createMockAssistantSession({ id: 'new-session', title: 'New Chat' }),
      ]

      const refreshButton = screen.getByTestId('refresh-sessions')
      await user.click(refreshButton)

      await waitFor(() => {
        expect(screen.getByTestId('session-new-session')).toBeInTheDocument()
      })
    })
  })

  describe('Conversation History', () => {
    it('should load messages for a session', async () => {
      assistantState.messages = [
        { id: 'msg-1', sessionId: 'session-1', role: 'user', content: 'Hello', createdAt: new Date() },
        { id: 'msg-2', sessionId: 'session-1', role: 'deo', content: 'Hi there!', createdAt: new Date() },
      ]
      
      setHandlers(...createAssistantHandlers(assistantState))

      function MessagesTestWrapper() {
        const [messages, setMessages] = React.useState<typeof assistantState.messages>([])

        const loadMessages = async () => {
          const response = await fetch('/api/assistants/messages?sessionId=session-1')
          const data = await response.json()
          setMessages(data)
        }

        React.useEffect(() => {
          loadMessages()
        }, [])

        return (
          <div>
            <button onClick={loadMessages} data-testid="load-messages">Load</button>
            <ul data-testid="messages-list">
              {messages.map(msg => (
                <li key={msg.id} data-testid={`message-${msg.id}`}>
                  {msg.role}: {msg.content}
                </li>
              ))}
            </ul>
          </div>
        )
      }

      customRender(<MessagesTestWrapper />)

      await waitFor(() => {
        expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
        expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
      })
    })

    it('should display messages in correct order', async () => {
      const now = Date.now()
      assistantState.messages = [
        { id: 'msg-1', sessionId: 'session-1', role: 'user', content: 'First', createdAt: new Date(now - 2000) },
        { id: 'msg-2', sessionId: 'session-1', role: 'deo', content: 'Second', createdAt: new Date(now - 1000) },
        { id: 'msg-3', sessionId: 'session-1', role: 'user', content: 'Third', createdAt: new Date(now) },
      ]
      
      setHandlers(...createAssistantHandlers(assistantState))

      function OrderedMessagesTestWrapper() {
        const [messages, setMessages] = React.useState<typeof assistantState.messages>([])

        React.useEffect(() => {
          fetch('/api/assistants/messages?sessionId=session-1')
            .then(res => res.json())
            .then(data => setMessages(data))
        }, [])

        return (
          <div data-testid="messages-order">
            {messages.map(msg => (
              <div key={msg.id} data-testid={`msg-${msg.id}`}>{msg.content}</div>
            ))}
          </div>
        )
      }

      customRender(<OrderedMessagesTestWrapper />)

      await waitFor(() => {
        const messagesContainer = screen.getByTestId('messages-order')
        const messageElements = within(messagesContainer).getAllByTestId(/msg-/)
        expect(messageElements[0]).toHaveTextContent('First')
        expect(messageElements[1]).toHaveTextContent('Second')
        expect(messageElements[2]).toHaveTextContent('Third')
      })
    })
  })

  describe('Agent-specific Behavior', () => {
    it('should use Deo system prompt for technical questions', async () => {
      setHandlers(...createAssistantHandlers(assistantState))

      const response = await fetch('/api/assistants/profiles/deo')
      const profile = await response.json()

      expect(profile.systemPrompt).toContain('Deo')
      expect(profile.systemPrompt).toMatch(/技术|technical/i)
    })

    it('should use Dia system prompt for creative tasks', async () => {
      setHandlers(...createAssistantHandlers(assistantState))

      const response = await fetch('/api/assistants/profiles/dia')
      const profile = await response.json()

      expect(profile.systemPrompt).toContain('Dia')
      expect(profile.systemPrompt).toMatch(/创意|creative/i)
    })

    it('should maintain agent context across messages', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAssistantHandlers(assistantState))

      function AgentContextTestWrapper() {
        const [messages, setMessages] = React.useState<{ role: string; content: string }[]>([])
        const [currentAgent, setCurrentAgent] = React.useState<AgentType>('deo')

        const sendMessage = async (agent: AgentType, message: string) => {
          const response = await fetch('/api/assistants/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent, message }),
          })
          const data = await response.json()
          setMessages(prev => [...prev, { role: 'user', content: message }, { role: data.agent, content: data.response }])
          setCurrentAgent(data.agent)
        }

        return (
          <div>
            <button onClick={() => sendMessage('deo', 'Hello')} data-testid="send-deo">Send to Deo</button>
            <button onClick={() => sendMessage('dia', 'Hello')} data-testid="send-dia">Send to Dia</button>
            <div data-testid="current-agent">{currentAgent}</div>
            <div data-testid="messages">
              {messages.map((msg, i) => (
                <div key={i} data-testid={`msg-${i}`}>{msg.role}: {msg.content}</div>
              ))}
            </div>
          </div>
        )
      }

      customRender(<AgentContextTestWrapper />)

      const deoButton = screen.getByTestId('send-deo')
      await user.click(deoButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-agent')).toHaveTextContent('deo')
      })

      const diaButton = screen.getByTestId('send-dia')
      await user.click(diaButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-agent')).toHaveTextContent('dia')
      })
    })
  })
})

function setHandlers(...handlers: Parameters<typeof server.use>[0]) {
  server.use(...handlers)
}

import { rest } from 'msw'
