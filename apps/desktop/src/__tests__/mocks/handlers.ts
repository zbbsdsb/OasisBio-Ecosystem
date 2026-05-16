import { rest } from 'msw'
import type { RestHandler } from 'msw'

const API_BASE = process.env.VITE_API_URL || 'https://api.test.oasisbio.com'

export interface MockAuthState {
  session: {
    user: {
      id: string
      email: string
      emailVerified: boolean
    }
    accessToken: string
    refreshToken: string
  } | null
  otpSent: boolean
  pendingEmail: string | null
}

export function createMockAuthState(): MockAuthState {
  return {
    session: null,
    otpSent: false,
    pendingEmail: null,
  }
}

export function createAuthHandlers(state: MockAuthState): RestHandler[] {
  return [
    rest.post(`${API_BASE}/auth/v1/otp`, async (req, res, ctx) => {
      const body = await req.json()
      const email = body?.email

      if (!email || typeof email !== 'string') {
        return res(
          ctx.status(400),
          ctx.json({ error: 'Email is required' })
        )
      }

      state.otpSent = true
      state.pendingEmail = email

      return res(ctx.status(200), ctx.json({}))
    }),

    rest.post(`${API_BASE}/auth/v1/verify`, async (req, res, ctx) => {
      const body = await req.json()
      const { email, token } = body || {}

      if (!state.otpSent || email !== state.pendingEmail) {
        return res(
          ctx.status(400),
          ctx.json({ error: 'OTP not sent or email mismatch' })
        )
      }

      if (!token || token === 'invalid') {
        return res(
          ctx.status(400),
          ctx.json({ error: 'Invalid OTP' })
        )
      }

      state.session = {
        user: {
          id: 'test-user-id',
          email: email,
          emailVerified: true,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }

      return res(
        ctx.status(200),
        ctx.json({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          user: {
            id: 'test-user-id',
            email: email,
            email_confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })
      )
    }),

    rest.post(`${API_BASE}/auth/v1/logout`, async (_, res, ctx) => {
      state.session = null
      state.otpSent = false
      state.pendingEmail = null
      return res(ctx.status(200))
    }),

    rest.post(`${API_BASE}/auth/v1/refresh`, async (req, res, ctx) => {
      const body = await req.json()
      const refreshToken = body?.refresh_token

      if (!refreshToken || refreshToken === 'expired') {
        return res(
          ctx.status(401),
          ctx.json({ error: 'Invalid or expired refresh token' })
        )
      }

      return res(
        ctx.status(200),
        ctx.json({
          access_token: 'new-mock-access-token',
          refresh_token: 'new-mock-refresh-token',
          expires_in: 3600,
        })
      )
    }),

    rest.get(`${API_BASE}/auth/v1/session`, async (_, res, ctx) => {
      if (!state.session) {
        return res(
          ctx.status(401),
          ctx.json({ error: 'No active session' })
        )
      }

      return res(
        ctx.status(200),
        ctx.json({
          user: state.session.user,
          access_token: state.session.accessToken,
        })
      )
    }),
  ]
}

export interface MockAssistantState {
  sessions: Array<{
    id: string
    agent: 'deo' | 'dia'
    title: string
    createdAt: Date
    updatedAt: Date
    messageCount: number
  }>
  messages: Array<{
    id: string
    sessionId: string
    role: 'user' | 'deo' | 'dia'
    content: string
    createdAt: Date
  }>
  profiles: {
    deo: {
      systemPrompt: string
      enabled: boolean
    }
    dia: {
      systemPrompt: string
      enabled: boolean
    }
  }
}

export function createMockAssistantState(): MockAssistantState {
  return {
    sessions: [],
    messages: [],
    profiles: {
      deo: {
        systemPrompt: 'You are Deo, a helpful technical assistant.',
        enabled: true,
      },
      dia: {
        systemPrompt: 'You are Dia, a creative companion.',
        enabled: true,
      },
    },
  }
}

export function createAssistantHandlers(state: MockAssistantState): RestHandler[] {
  return [
    rest.get(`${API_BASE}/api/assistants/profiles/:agent`, async (req, res, ctx) => {
      const agent = req.params.agent as 'deo' | 'dia'
      const profile = state.profiles[agent]

      return res(
        ctx.status(200),
        ctx.json({
          systemPrompt: profile.systemPrompt,
          enabled: profile.enabled,
          model: 'gpt-4o',
        })
      )
    }),

    rest.put(`${API_BASE}/api/assistants/profiles/:agent`, async (req, res, ctx) => {
      const agent = req.params.agent as 'deo' | 'dia'
      const body = await req.json()

      state.profiles[agent] = {
        ...state.profiles[agent],
        ...body,
      }

      return res(ctx.status(200))
    }),

    rest.post(`${API_BASE}/api/assistants/sessions`, async (req, res, ctx) => {
      const body = await req.json()
      const agent = body?.agent || 'deo'
      const sessionId = `session-${Date.now()}`

      state.sessions.push({
        id: sessionId,
        agent,
        title: 'New Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
      })

      return res(
        ctx.status(200),
        ctx.json({ sessionId })
      )
    }),

    rest.get(`${API_BASE}/api/assistants/sessions`, async (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(state.sessions)
      )
    }),

    rest.get(`${API_BASE}/api/assistants/sessions/:sessionId`, async (req, res, ctx) => {
      const sessionId = req.params.sessionId as string
      const session = state.sessions.find(s => s.id === sessionId)

      if (!session) {
        return res(ctx.status(404))
      }

      return res(ctx.status(200), ctx.json(session))
    }),

    rest.delete(`${API_BASE}/api/assistants/sessions/:sessionId`, async (req, res, ctx) => {
      const sessionId = req.params.sessionId as string
      state.sessions = state.sessions.filter(s => s.id !== sessionId)
      state.messages = state.messages.filter(m => m.sessionId !== sessionId)
      return res(ctx.status(200))
    }),

    rest.get(`${API_BASE}/api/assistants/messages`, async (req, res, ctx) => {
      const url = new URL(req.url as unknown as URL)
      const sessionId = url.searchParams.get('sessionId')

      const messages = state.messages.filter(m => m.sessionId === sessionId)
      return res(ctx.status(200), ctx.json(messages))
    }),

    rest.post(`${API_BASE}/api/assistants/chat`, async (req, res, ctx) => {
      const body = await req.json()
      const { sessionId, agent, message } = body || {}

      let targetSessionId = sessionId
      if (!targetSessionId) {
        targetSessionId = `session-${Date.now()}`
        state.sessions.push({
          id: targetSessionId,
          agent: agent || 'deo',
          title: message?.substring(0, 30) || 'New Chat',
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
        })
      }

      const userMessageId = `msg-${Date.now()}`
      state.messages.push({
        id: userMessageId,
        sessionId: targetSessionId,
        role: 'user',
        content: message,
        createdAt: new Date(),
      })

      const assistantMessageId = `msg-${Date.now() + 1}`
      const assistantResponse = `Hello! I'm ${agent || 'Deo'}. How can I help you today?`
      
      state.messages.push({
        id: assistantMessageId,
        sessionId: targetSessionId,
        role: agent || 'deo',
        content: assistantResponse,
        createdAt: new Date(),
      })

      const session = state.sessions.find(s => s.id === targetSessionId)
      if (session) {
        session.messageCount += 2
        session.updatedAt = new Date()
      }

      return res(
        ctx.status(200),
        ctx.json({
          sessionId: targetSessionId,
          agent: agent || 'deo',
          response: assistantResponse,
        })
      )
    }),
  ]
}

export interface MockWorldState {
  worlds: Array<{
    id: string
    userId: string
    name: string
    summary: string
    createdAt: Date
    updatedAt: Date
  }>
}

export function createMockWorldState(): MockWorldState {
  return {
    worlds: [],
  }
}

export function createWorldHandlers(state: MockWorldState, userId: string): RestHandler[] {
  return [
    rest.get(`${API_BASE}/api/worlds`, async (_, res, ctx) => {
      const userWorlds = state.worlds.filter(w => w.userId === userId)
      return res(ctx.status(200), ctx.json(userWorlds))
    }),

    rest.get(`${API_BASE}/api/worlds/:worldId`, async (req, res, ctx) => {
      const worldId = req.params.worldId as string
      const world = state.worlds.find(w => w.id === worldId)

      if (!world) {
        return res(ctx.status(404))
      }

      return res(ctx.status(200), ctx.json(world))
    }),

    rest.post(`${API_BASE}/api/worlds`, async (req, res, ctx) => {
      const body = await req.json()
      const worldId = `world-${Date.now()}`

      const newWorld = {
        id: worldId,
        userId,
        name: body?.name || 'Untitled World',
        summary: body?.summary || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      state.worlds.push(newWorld)

      return res(ctx.status(201), ctx.json(newWorld))
    }),

    rest.put(`${API_BASE}/api/worlds/:worldId`, async (req, res, ctx) => {
      const worldId = req.params.worldId as string
      const body = await req.json()
      const worldIndex = state.worlds.findIndex(w => w.id === worldId)

      if (worldIndex === -1) {
        return res(ctx.status(404))
      }

      state.worlds[worldIndex] = {
        ...state.worlds[worldIndex],
        ...body,
        updatedAt: new Date(),
      }

      return res(ctx.status(200), ctx.json(state.worlds[worldIndex]))
    }),

    rest.delete(`${API_BASE}/api/worlds/:worldId`, async (req, res, ctx) => {
      const worldId = req.params.worldId as string
      state.worlds = state.worlds.filter(w => w.id !== worldId)
      return res(ctx.status(200))
    }),
  ]
}

export interface MockOAuthState {
  codeVerifier: string | null
  state: string | null
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
  } | null
}

export function createMockOAuthState(): MockOAuthState {
  return {
    codeVerifier: null,
    state: null,
    tokens: null,
  }
}

export function createOAuthHandlers(state: MockOAuthState): RestHandler[] {
  return [
    rest.post(`${API_BASE}/oauth/token`, async (req, res, ctx) => {
      const body = await req.json()
      const { code, codeVerifier, grantType } = body || {}

      if (grantType === 'authorization_code') {
        if (!code || code === 'invalid') {
          return res(
            ctx.status(400),
            ctx.json({ error: 'invalid_grant', errorDescription: 'Invalid authorization code' })
          )
        }

        state.tokens = {
          accessToken: 'oauth-access-token',
          refreshToken: 'oauth-refresh-token',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        }

        return res(
          ctx.status(200),
          ctx.json({
            access_token: 'oauth-access-token',
            refresh_token: 'oauth-refresh-token',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'profile email',
          })
        )
      }

      if (grantType === 'refresh_token') {
        const refreshToken = body?.refreshToken

        if (!refreshToken || refreshToken === 'expired') {
          return res(
            ctx.status(400),
            ctx.json({ error: 'invalid_grant', errorDescription: 'Invalid refresh token' })
          )
        }

        state.tokens = {
          accessToken: 'new-oauth-access-token',
          refreshToken: 'new-oauth-refresh-token',
          expiresAt: new Date(Date.now() + 3600 * 1000),
        }

        return res(
          ctx.status(200),
          ctx.json({
            access_token: 'new-oauth-access-token',
            refresh_token: 'new-oauth-refresh-token',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'profile email',
          })
        )
      }

      return res(
        ctx.status(400),
        ctx.json({ error: 'unsupported_grant_type' })
      )
    }),

    rest.get(`${API_BASE}/oauth/userinfo`, async (_, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          userId: 'oauth-user-id',
          username: 'oauthuser',
          displayName: 'OAuth User',
          avatarUrl: null,
          email: 'oauth@example.com',
        })
      )
    }),

    rest.post(`${API_BASE}/oauth/revoke`, async (_, res, ctx) => {
      state.tokens = null
      return res(ctx.status(200))
    }),
  ]
}

export function createAllHandlers(
  authState: MockAuthState,
  assistantState: MockAssistantState,
  worldState: MockWorldState,
  oauthState: MockOAuthState,
  userId: string
): RestHandler[] {
  return [
    ...createAuthHandlers(authState),
    ...createAssistantHandlers(assistantState),
    ...createWorldHandlers(worldState, userId),
    ...createOAuthHandlers(oauthState),
  ]
}
