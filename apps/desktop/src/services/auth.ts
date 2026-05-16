import { createClient, SupabaseClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js'
import type { AuthSession, AuthCredentials } from '@oasisbio/common-auth'
import type { User, Profile } from '@oasisbio/common-core'
import { OasisBioError, ERROR_CODES } from '../utils/errors'

const SERVICE_NAME = 'oasisbio-desktop'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new OasisBioError('Missing Supabase configuration. Please check your environment variables.', {
        code: ERROR_CODES.INTERNAL_ERROR
      })
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  }
  return supabaseClient
}

const transformSession = (supabaseSession: SupabaseSession, profile?: Profile): AuthSession => {
  const user: User = {
    id: supabaseSession.user.id,
    email: supabaseSession.user.email || '',
    emailVerified: supabaseSession.user.email_confirmed_at !== null,
    createdAt: new Date(supabaseSession.user.created_at),
    updatedAt: new Date(supabaseSession.user.updated_at),
    status: 'ACTIVE' as any,
    metadata: supabaseSession.user.user_metadata
  }

  const defaultProfile: Profile = {
    id: supabaseSession.user.id,
    userId: supabaseSession.user.id,
    displayName: supabaseSession.user.email?.split('@')[0] || 'User',
    avatarUrl: null,
    bio: null,
    createdAt: new Date(supabaseSession.user.created_at),
    updatedAt: new Date(supabaseSession.user.updated_at),
    metadata: {}
  }

  return {
    user,
    profile: profile || defaultProfile,
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresAt: new Date(Date.now() + (supabaseSession.expires_in || 3600) * 1000)
  }
}

export const sendOtp = async (email: string): Promise<void> => {
  try {
    const client = getSupabaseClient()
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })

    if (error) {
      throw new OasisBioError(error.message, {
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { supabaseError: error }
      })
    }
  } catch (error) {
    if (error instanceof OasisBioError) {
      throw error
    }
    throw new OasisBioError(
      'Failed to send OTP. Please check your network connection.',
      { code: ERROR_CODES.NETWORK_ERROR, details: error }
    )
  }
}

export const verifyOtp = async (email: string, token: string): Promise<AuthSession> => {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      throw new OasisBioError(error.message, {
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { supabaseError: error }
      })
    }

    if (!data.session) {
      throw new OasisBioError('Invalid OTP. Please try again.', {
        code: ERROR_CODES.VALIDATION_ERROR
      })
    }

    const session = transformSession(data.session)
    await storeSession(session)
    
    return session
  } catch (error) {
    if (error instanceof OasisBioError) {
      throw error
    }
    throw new OasisBioError(
      'Failed to verify OTP. Please check your network connection.',
      { code: ERROR_CODES.NETWORK_ERROR, details: error }
    )
  }
}

export const signOut = async (): Promise<void> => {
  try {
    const client = getSupabaseClient()
    await client.auth.signOut()
    await clearStoredSession()
  } catch (error) {
    await clearStoredSession()
    if (error instanceof OasisBioError) {
      throw error
    }
    throw new OasisBioError(
      'Failed to sign out. Please try again.',
      { code: ERROR_CODES.INTERNAL_ERROR, details: error }
    )
  }
}

export const refreshSession = async (): Promise<AuthSession | null> => {
  try {
    const client = getSupabaseClient()
    
    const storedSession = await getStoredSession()
    if (!storedSession?.refreshToken) {
      return null
    }

    const { data, error } = await client.auth.refreshSession({
      refresh_token: storedSession.refreshToken
    })

    if (error) {
      await clearStoredSession()
      throw new OasisBioError('Session expired. Please log in again.', {
        code: ERROR_CODES.UNAUTHORIZED,
        details: { supabaseError: error }
      })
    }

    if (!data.session) {
      await clearStoredSession()
      return null
    }

    const newSession = transformSession(data.session)
    await storeSession(newSession)
    return newSession
  } catch (error) {
    if (error instanceof OasisBioError) {
      throw error
    }
    await clearStoredSession()
    return null
  }
}

export const getSession = async (): Promise<AuthSession | null> => {
  try {
    const stored = await getStoredSession()
    if (!stored) return null

    if (new Date(stored.expiresAt) < new Date()) {
      return await refreshSession()
    }

    return stored
  } catch {
    return null
  }
}

export const storeSession = async (session: AuthSession): Promise<void> => {
  try {
    const { ipcRenderer } = window as any
    if (ipcRenderer) {
      await ipcRenderer.invoke('auth:store-session', JSON.stringify(session))
    } else {
      if (typeof keytar !== 'undefined') {
        await keytar.setPassword(SERVICE_NAME, 'session', JSON.stringify(session))
      } else {
        localStorage.setItem('oasisbio-session', JSON.stringify(session))
      }
    }
  } catch (error) {
    console.error('Failed to store session:', error)
  }
}

const getStoredSession = async (): Promise<AuthSession | null> => {
  try {
    const { ipcRenderer } = window as any
    let sessionData: string | null = null

    if (ipcRenderer) {
      sessionData = await ipcRenderer.invoke('auth:get-stored-session')
    } else {
      if (typeof keytar !== 'undefined') {
        sessionData = await keytar.getPassword(SERVICE_NAME, 'session')
      } else {
        sessionData = localStorage.getItem('oasisbio-session')
      }
    }

    if (!sessionData) return null

    const parsed = JSON.parse(sessionData)
    return {
      ...parsed,
      expiresAt: new Date(parsed.expiresAt)
    }
  } catch (error) {
    console.error('Failed to get stored session:', error)
    return null
  }
}

const clearStoredSession = async (): Promise<void> => {
  try {
    const { ipcRenderer } = window as any
    if (ipcRenderer) {
      await ipcRenderer.invoke('auth:clear-stored-session')
    } else {
      if (typeof keytar !== 'undefined') {
        await keytar.deletePassword(SERVICE_NAME, 'session')
      } else {
        localStorage.removeItem('oasisbio-session')
      }
    }
  } catch (error) {
    console.error('Failed to clear stored session:', error)
  }
}
