/**
 * Auth API — single module file (all auth methods).
 * Mock for V1 UI; replace bodies with real backend calls later.
 *
 * Temporary test user: username `admin` / password `123`
 */

import type {
  AuthSession,
  AuthUser,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from '../schemas/auth'
import { MOCK_LOGIN_PASSWORD, MOCK_LOGIN_USERNAME } from '../schemas/auth'
import { setCurrentEmploymentId } from '@/shared/rbac'

const STORAGE_KEY = 'bytevon_auth_session'
const RESET_TOKENS_KEY = 'bytevon_reset_tokens'

const ADMIN_USER: AuthUser = {
  id: 1,
  username: MOCK_LOGIN_USERNAME,
  email: 'admin@bytevon.example',
  name: 'Admin User',
  role: 'Administrator',
  department: 'Operations',
  employmentId: 1,
  personId: 1,
}

function delay(ms = 500) {
  return new Promise((r) => setTimeout(r, ms))
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
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    // Backfill older sessions missing employmentId
    if (session.user && session.user.employmentId == null) {
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
    localStorage.removeItem(STORAGE_KEY)
    setCurrentEmploymentId(null)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  setCurrentEmploymentId(session.user.employmentId)
}

export async function loginApi(input: LoginInput): Promise<AuthSession> {
  await delay()

  const username = input.username.trim().toLowerCase()
  const password = input.password

  if (username !== MOCK_LOGIN_USERNAME || password !== MOCK_LOGIN_PASSWORD) {
    throw new Error('Invalid username or password.')
  }

  const session: AuthSession = {
    user: ADMIN_USER,
    tokens: makeTokens(),
  }
  persistSession(session)
  return session
}

export async function logoutApi(_revokeAll = false): Promise<void> {
  await delay(250)
  persistSession(null)
}

export async function refreshApi(refreshToken: string): Promise<AuthSession> {
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
