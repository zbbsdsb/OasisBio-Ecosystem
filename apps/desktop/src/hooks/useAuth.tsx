import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { AuthSession, AuthState } from '@oasisbio/common-auth'
import * as authService from '../services/auth'
import * as oauthService from '../services/oauthService'

interface AuthContextType extends AuthState {
  sendOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  loginWithOAuth: () => Promise<boolean>
  handleOAuthCallback: (url: string) => Promise<boolean>
  isOAuthAvailable: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    isLoading: true,
    error: null
  })
  const [isOAuthAvailable, setIsOAuthAvailable] = useState(false)

  useEffect(() => {
    initializeAuth()
    checkOAuthAvailability()
  }, [])

  const initializeAuth = async () => {
    try {
      const session = await authService.getSession()
      setAuthState({
        session,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAuthState({
        session: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to initialize auth')
      })
    }
  }

  const checkOAuthAvailability = useCallback(() => {
    const oauthClientId = import.meta.env.VITE_OAUTH_CLIENT_ID || process.env.VITE_OAUTH_CLIENT_ID
    const oauthApiUrl = import.meta.env.VITE_OAUTH_API_URL || process.env.VITE_OAUTH_API_URL
    setIsOAuthAvailable(!!oauthClientId && !!oauthApiUrl)
  }, [])

  const sendOtp = async (email: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await authService.sendOtp(email)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to send OTP')
      }))
      throw error
    }
  }

  const verifyOtp = async (email: string, token: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const session = await authService.verifyOtp(email, token)
      setAuthState({
        session,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to verify OTP')
      }))
      throw error
    }
  }

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await oauthService.logout()
      await authService.signOut()
      setAuthState({
        session: null,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign out')
      }))
      throw error
    }
  }

  const refreshSession = async () => {
    try {
      const session = await authService.refreshSession()
      if (session) {
        setAuthState(prev => ({
          ...prev,
          session,
          error: null
        }))
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to refresh session')
      }))
    }
  }

  const loginWithOAuth = useCallback(async (): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const { authUrl } = await oauthService.initiateOAuthFlow()
      
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = authUrl
      }
      
      return true
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('OAuth login failed')
      }))
      return false
    }
  }, [])

  const handleOAuthCallback = useCallback(async (url: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const { code, state, error } = oauthService.parseOAuthCallback(url)
      
      if (error) {
        throw new Error(error)
      }
      
      if (!code || !state) {
        throw new Error('Missing OAuth callback parameters')
      }
      
      const tokens = await oauthService.exchangeCodeForTokens(code, state)
      const userInfo = await oauthService.getUserInfo(tokens.accessToken)
      
      const session: AuthSession = {
        user: {
          id: userInfo.userId,
          email: userInfo.email || '',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'ACTIVE' as any,
          metadata: {}
        },
        profile: {
          id: userInfo.userId,
          userId: userInfo.userId,
          displayName: userInfo.displayName,
          avatarUrl: userInfo.avatarUrl,
          bio: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {}
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      }
      
      await authService.storeSession(session)
      
      setAuthState({
        session,
        isLoading: false,
        error: null
      })
      
      return true
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('OAuth callback failed')
      }))
      return false
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_CALLBACK') {
          await handleOAuthCallback(event.data.url)
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      const currentUrl = window.location.href
      if (currentUrl.includes('code=') && currentUrl.includes('state=')) {
        handleOAuthCallback(currentUrl)
      }
      
      return () => {
        window.removeEventListener('message', handleMessage)
      }
    }
  }, [handleOAuthCallback])

  const value: AuthContextType = {
    ...authState,
    sendOtp,
    verifyOtp,
    signOut,
    refreshSession,
    loginWithOAuth,
    handleOAuthCallback,
    isOAuthAvailable
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const useSession = (): AuthSession | null => {
  const { session } = useAuth()
  return session
}
