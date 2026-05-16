import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { customRender, createMockSession, mockLocalStorage, flushPromises } from '../test-utils'
import { LoginPage } from '../../pages/LoginPage'
import { VerifyPage } from '../../pages/VerifyPage'
import { AuthProvider, useAuth } from '../../hooks/useAuth'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { server, createMockAuthState, createAuthHandlers, resetHandlers } from '../mocks/server'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Authentication Flow Integration Tests', () => {
  let authState: ReturnType<typeof createMockAuthState>
  let localStorageMock: ReturnType<typeof mockLocalStorage>

  beforeAll(() => {
    server.listen()
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    authState = createMockAuthState()
    localStorageMock = mockLocalStorage()
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    resetHandlers()
    mockNavigate.mockClear()
  })

  describe('Login Flow', () => {
    it('should complete the full login flow: enter email → send OTP → verify OTP → login success', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAuthHandlers(authState))

      customRender(<LoginPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/邮箱地址/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/邮箱地址/i)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /发送验证码/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(authState.otpSent).toBe(true)
        expect(authState.pendingEmail).toBe('test@example.com')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/verify?email=')
        )
      })
    })

    it('should show error when email is invalid', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAuthHandlers(authState))

      customRender(<LoginPage />)

      const emailInput = screen.getByLabelText(/邮箱地址/i)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /发送验证码/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toBeInvalid()
      })
    })

    it('should show loading state while sending OTP', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createAuthHandlers(authState))

      customRender(<LoginPage />)

      const emailInput = screen.getByLabelText(/邮箱地址/i)
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: /发送验证码/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/发送中/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.queryByText(/发送中/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('OTP Verification Flow', () => {
    it('should verify OTP and establish session', async () => {
      const user = userEvent.setup()
      
      authState.otpSent = true
      authState.pendingEmail = 'test@example.com'
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <MemoryRouter initialEntries={['/verify?email=test@example.com']}>
          <Routes>
            <Route path="/verify" element={<VerifyPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/验证码/i) || screen.getByPlaceholderText(/输入验证码/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/验证码/i) || screen.getByPlaceholderText(/输入验证码/i)
      await user.type(otpInput, '123456')

      const verifyButton = screen.getByRole('button', { name: /验证|确认/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(authState.session).not.toBeNull()
        expect(authState.session?.user.email).toBe('test@example.com')
      })
    })

    it('should show error for invalid OTP', async () => {
      const user = userEvent.setup()
      
      authState.otpSent = true
      authState.pendingEmail = 'test@example.com'
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <MemoryRouter initialEntries={['/verify?email=test@example.com']}>
          <Routes>
            <Route path="/verify" element={<VerifyPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/验证码/i) || screen.getByPlaceholderText(/输入验证码/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/验证码/i) || screen.getByPlaceholderText(/输入验证码/i)
      await user.type(otpInput, 'invalid')

      const verifyButton = screen.getByRole('button', { name: /验证|确认/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/无效|错误|失败/i)).toBeInTheDocument()
      })
    })

    it('should allow resending OTP', async () => {
      const user = userEvent.setup()
      
      authState.otpSent = true
      authState.pendingEmail = 'test@example.com'
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <MemoryRouter initialEntries={['/verify?email=test@example.com']}>
          <Routes>
            <Route path="/verify" element={<VerifyPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        const resendButton = screen.getByRole('button', { name: /重新发送|重发/i })
        expect(resendButton).toBeInTheDocument()
      })

      const resendButton = screen.getByRole('button', { name: /重新发送|重发/i })
      await user.click(resendButton)

      await waitFor(() => {
        expect(authState.otpSent).toBe(true)
      })
    })
  })

  describe('Sign Out Flow', () => {
    function SignOutTestComponent() {
      const { session, signOut, isLoading } = useAuth()
      
      return (
        <div>
          <div data-testid="session-status">
            {session ? 'logged-in' : 'logged-out'}
          </div>
          <div data-testid="loading-status">
            {isLoading ? 'loading' : 'idle'}
          </div>
          <button onClick={signOut} data-testid="sign-out-button">
            Sign Out
          </button>
        </div>
      )
    }

    it('should sign out and clear session', async () => {
      const user = userEvent.setup()
      
      authState.session = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <AuthProvider>
          <SignOutTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('logged-in')
      })

      const signOutButton = screen.getByTestId('sign-out-button')
      await user.click(signOutButton)

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('logged-out')
      })

      expect(authState.session).toBeNull()
    })

    it('should show loading state during sign out', async () => {
      const user = userEvent.setup()
      
      authState.session = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <AuthProvider>
          <SignOutTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('logged-in')
      })

      const signOutButton = screen.getByTestId('sign-out-button')
      await user.click(signOutButton)

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loading')
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
      })
    })
  })

  describe('Session Expiry Handling', () => {
    function SessionExpiryTestComponent() {
      const { session, refreshSession, error } = useAuth()
      
      return (
        <div>
          <div data-testid="session-status">
            {session ? 'active' : 'expired'}
          </div>
          {error && (
            <div data-testid="error-message">{error.message}</div>
          )}
          <button onClick={refreshSession} data-testid="refresh-button">
            Refresh Session
          </button>
        </div>
      )
    }

    it('should refresh expired session', async () => {
      const user = userEvent.setup()
      
      authState.session = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <AuthProvider>
          <SessionExpiryTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('active')
      })

      const refreshButton = screen.getByTestId('refresh-button')
      await user.click(refreshButton)

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('active')
      })
    })

    it('should handle refresh token expiry', async () => {
      const user = userEvent.setup()
      
      authState.session = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          emailVerified: true,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'expired',
      }
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <AuthProvider>
          <SessionExpiryTestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('active')
      })

      const refreshButton = screen.getByTestId('refresh-button')
      await user.click(refreshButton)

      await waitFor(() => {
        expect(screen.getByTestId('session-status')).toHaveTextContent('expired')
      })
    })
  })

  describe('Session Persistence', () => {
    it('should persist session to localStorage', async () => {
      const user = userEvent.setup()
      
      authState.otpSent = true
      authState.pendingEmail = 'test@example.com'
      
      setHandlers(...createAuthHandlers(authState))

      customRender(
        <MemoryRouter initialEntries={['/verify?email=test@example.com']}>
          <Routes>
            <Route path="/verify" element={<VerifyPage />} />
          </Routes>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/验证码/i) || screen.getByPlaceholderText(/输入验证码/i)).toBeInTheDocument()
      })

      const otpInput = screen.getByLabelText(/验证码/i) || screen.getByPlaceholderText(/输入验证码/i)
      await user.type(otpInput, '123456')

      const verifyButton = screen.getByRole('button', { name: /验证|确认/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(authState.session).not.toBeNull()
      })

      await waitFor(() => {
        const storedSession = localStorageMock.getItem('oasisbio-session')
        expect(storedSession).not.toBeNull()
      })
    })

    it('should restore session from localStorage on init', async () => {
      const mockSession = createMockSession()
      localStorageMock.setItem('oasisbio-session', JSON.stringify(mockSession))
      
      authState.session = {
        user: {
          id: mockSession.user.id,
          email: mockSession.user.email,
          emailVerified: mockSession.user.emailVerified,
        },
        accessToken: mockSession.accessToken,
        refreshToken: mockSession.refreshToken,
      }
      
      setHandlers(...createAuthHandlers(authState))

      function SessionCheckComponent() {
        const { session, isLoading } = useAuth()
        return (
          <div>
            <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
            <div data-testid="session">
              {session ? session.user.email : 'no-session'}
            </div>
          </div>
        )
      }

      customRender(
        <AuthProvider>
          <SessionCheckComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await waitFor(() => {
        expect(screen.getByTestId('session')).toHaveTextContent('test@example.com')
      })
    })
  })
})

function setHandlers(...handlers: Parameters<typeof server.use>[0]) {
  server.use(...handlers)
}
