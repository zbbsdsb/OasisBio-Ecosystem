import React, { ReactElement } from 'react'
import { render, RenderOptions, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom'
import { AuthProvider } from '../hooks/useAuth'
import { ThemeProvider } from '../contexts/ThemeContext'

export * from '@testing-library/react'
export { userEvent }

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps
  withAuth?: boolean
  initialAuthState?: {
    session?: {
      user: {
        id: string
        email: string
        emailVerified: boolean
        createdAt: Date
        updatedAt: Date
        status: string
        metadata: Record<string, unknown>
      }
      profile: {
        id: string
        userId: string
        displayName: string
        avatarUrl: string | null
        bio: string | null
        createdAt: Date
        updatedAt: Date
        metadata: Record<string, unknown>
      }
      accessToken: string
      refreshToken: string
      expiresAt: Date
    } | null
    isLoading?: boolean
    error?: Error | null
  }
}

const AllProviders: React.FC<{
  children: React.ReactNode
  routerProps?: MemoryRouterProps
}> = ({ children, routerProps }) => {
  return (
    <MemoryRouter {...routerProps}>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { routerProps, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders routerProps={routerProps}>{children}</AllProviders>
    ),
    ...renderOptions,
  })
}

export function createMockSession(overrides: Partial<{
  userId: string
  email: string
  displayName: string
  accessToken: string
}> = {}) {
  const now = new Date()
  return {
    user: {
      id: overrides.userId || 'test-user-id',
      email: overrides.email || 'test@example.com',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      status: 'ACTIVE',
      metadata: {},
    },
    profile: {
      id: overrides.userId || 'test-user-id',
      userId: overrides.userId || 'test-user-id',
      displayName: overrides.displayName || 'Test User',
      avatarUrl: null,
      bio: null,
      createdAt: now,
      updatedAt: now,
      metadata: {},
    },
    accessToken: overrides.accessToken || 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600 * 1000),
  }
}

export function createMockWorld(overrides: Partial<{
  id: string
  name: string
  summary: string
}> = {}) {
  return {
    id: overrides.id || 'test-world-id',
    userId: 'test-user-id',
    name: overrides.name || 'Test World',
    summary: overrides.summary || 'A test world for testing',
    timeSetting: null,
    physicsRules: null,
    rules: null,
    socialStructure: null,
    factions: null,
    geography: null,
    majorConflict: null,
    aestheticKeywords: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function createMockAssistantSession(overrides: Partial<{
  id: string
  agent: 'deo' | 'dia'
  title: string
}> = {}) {
  return {
    id: overrides.id || 'test-session-id',
    agent: overrides.agent || 'deo',
    title: overrides.title || 'Test Session',
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 1,
  }
}

export function createMockMessage(overrides: Partial<{
  id: string
  role: 'user' | 'deo' | 'dia'
  content: string
}> = {}) {
  return {
    id: overrides.id || `msg-${Date.now()}`,
    role: overrides.role || 'user',
    content: overrides.content || 'Test message',
    createdAt: new Date(),
  }
}

export async function waitForLoadingToFinish() {
  await waitFor(() => {
    const loadingElements = screen.queryAllByRole('status')
    const spinners = screen.queryAllByTestId('spinner')
    expect(loadingElements.length + spinners.length).toBe(0)
  }, { timeout: 5000 })
}

export function mockLocalStorage() {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get store() {
      return { ...store }
    },
  }
}

export function mockSessionStorage() {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get store() {
      return { ...store }
    },
  }
}

export function createMockFetch(response: unknown, options: {
  status?: number
  ok?: boolean
  delay?: number
} = {}) {
  const { status = 200, ok = true, delay = 0 } = options
  
  return jest.fn().mockImplementation(async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    return {
      ok,
      status,
      json: async () => response,
      text: async () => typeof response === 'string' ? response : JSON.stringify(response),
    }
  })
}

export function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
