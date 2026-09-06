/**
 * Auth API — single module file (login, logout, refresh, password flows).
 * env.useMockApi → sessionStorage mock; false → POST /auth/*
 *
 * Temporary test user (mock): email `admin@example.com` / password `123`
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import type {
  AuthSession,
  AuthUser,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from '../schemas/auth'
import { MOCK_LOGIN_EMAIL, MOCK_LOGIN_PASSWORD } from '../schemas/auth'
import { setCurrentEmploymentId } from '@/shared/rbac'
import type {AxiosErrorResponse} from "../types.ts"

import { delay} from '@/shared/mock/db'

// sessionStorage for auth session (tab-scoped); localStorage fallback for legacy reads.
const STORAGE_KEY = 'bytevon_auth_session'
const RESET_TOKENS_KEY = 'bytevon_reset_tokens'

interface BackendLoginResponse {
  tokens: {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }
  login_id: number
  person_id: number
  email: string
}

const ADMIN_USER: AuthUser = {
  id: 1,
  username: MOCK_LOGIN_EMAIL,
  email: 'admin@bytevon.example',
  name: 'Admin User',
  role: 'Administrator',
  department: 'Operations',
  employmentId: 1,
  personId: 1,
}



function makeTokens(): AuthSession['tokens'] {
  const id = Math.random().toString(36).slice(2)
  return {
    accessToken: `access_${id}`,
    refreshToken: `refresh_${id}`,
    expiresIn: 600,
  }
}

export function loadStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    // Guard against stale/corrupt entries missing the user object.
    if (!session || !session.user) {
      sessionStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    if (session.user.employmentId == null) {
      session.user.employmentId = 1
      session.user.personId = session.user.personId ?? 1
    }
    if (session.user?.employmentId != null) {
      setCurrentEmploymentId(session.user.employmentId)
    }
    return session
  } catch {
    return null
  }
}

export function persistSession(session: AuthSession | null) {
  if (!session) {
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    setCurrentEmploymentId(null)
    return
  }
  const payload = JSON.stringify(session)
  sessionStorage.setItem(STORAGE_KEY, payload)
  localStorage.setItem(STORAGE_KEY, payload)
  setCurrentEmploymentId(session.user.employmentId)
}

export async function loginApi(input: LoginInput): Promise<AuthSession> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<BackendLoginResponse>('/auth/login', {
      email: input.email.trim(),
      password: input.password,
      // The backend does not use a `rememberMe` flag, but we keep it for compatibility with the mock.
      // It will be ignored by the real API.
      rememberMe: input.rememberMe ?? false,
    })
    const session: AuthSession = {
      user: {
        id: data.person_id,
        username: data.email,
        email: data.email,
        name: 'System Admin',
        role: 'Administrator',
        department: 'Administration',
        employmentId: 1,
        personId: data.person_id,
      },
      tokens: {
        accessToken: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token,
        expiresIn: data.tokens.expires_in,
      },
    }
    persistSession(session)
    return session
  }

  await delay()
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (email !== MOCK_LOGIN_EMAIL || password !== MOCK_LOGIN_PASSWORD) {
    throw new Error('Invalid username or password.')
  }

  const session: AuthSession = {
    user: ADMIN_USER,
    tokens: makeTokens(),
  }
  persistSession(session)
  return session
}

export async function logoutApi(revokeAll = false): Promise<void> {
  if (!env.useMockApi) {
    try {
      await apiClient.post('/auth/logout', { revokeAll })
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
    persistSession(null)
    return
  }
  await delay(250)
  persistSession(null)
}

export async function refreshApi(refreshToken: string): Promise<AuthSession> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.post<AuthSession>('/auth/refresh', { refreshToken })
      persistSession(data)
      return data
    } catch (err) {
      // Only a definitive 401 means the refresh token is invalid.
      // Network errors / 5xx / backend-down must NOT wipe the local session,
      // otherwise users get logged out on every route change while offline.
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as AxiosErrorResponse).response?.status
          : undefined
      if (status === 401) {
        persistSession(null)
        throw new Error('SESSION_EXPIRED')
      }
      const current = loadStoredSession()
      if (!current) throw new Error('SESSION_EXPIRED')
      return current
    }
  }

  await delay(150)
  const current = loadStoredSession()
  if (!current || current.tokens.refreshToken !== refreshToken) {
    persistSession(null)
    throw new Error('SESSION_EXPIRED')
  }
  const next: AuthSession = {
    ...current,
    tokens: makeTokens(),
  }
  next.tokens.refreshToken = refreshToken
  persistSession(next)
  return next
}

export async function forgotPasswordApi(input: ForgotPasswordInput): Promise<{ message: string }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', input)
    return data
  }

  await delay()
  const token = `rst_${Math.random().toString(36).slice(2)}_${Date.now()}`
  const map = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '{}') as Record<
    string,
    { email: string; exp: number }
  >
  map[token] = { email: input.email, exp: Date.now() + 10 * 60 * 1000 }
  localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(map))
  console.info('[auth mock] Password reset token (dev only):', token)
  return { message: 'If an account exists for that email, a reset link has been sent.' }
}

export async function resetPasswordApi(
  token: string,
  input: ResetPasswordInput,
): Promise<{ message: string }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      password: input.password,
      confirmPassword: input.confirmPassword,
    })
    return data
  }

  await delay()
  const map = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '{}') as Record<
    string,
    { email: string; exp: number }
  >
  const entry = map[token]
  if (!entry || entry.exp < Date.now()) {
    throw new Error('This reset link is invalid or has expired.')
  }
  delete map[token]
  localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(map))
  void input.password
  return { message: 'Password updated. You can sign in with your new password.' }
}

export async function changePasswordApi(input: ChangePasswordInput): Promise<{ message: string }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<{ message: string }>('/auth/change-password', input)
    return data
  }

  await delay()
  if (input.currentPassword === 'wrong') {
    throw new Error('Current password is incorrect.')
  }
  if (input.revokeAllSessions) {
    const session = loadStoredSession()
    if (session) {
      session.tokens = makeTokens()
      persistSession(session)
    }
  }
  return { message: 'Password changed successfully.' }
}
