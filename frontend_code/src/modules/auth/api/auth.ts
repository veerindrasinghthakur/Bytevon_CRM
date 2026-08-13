/**
 * Auth API (mock for V1 UI).
 * Locked V1: login / logout / refresh / revoke session(s),
 * forgot-password + single-use reset token, no MFA, no password history.
 * Swap implementations for real backend later.
 */

import type {
  AuthSession,
  AuthUser,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from '../schemas/auth'

const STORAGE_KEY = 'bytevon_auth_session'
const RESET_TOKENS_KEY = 'bytevon_reset_tokens'

const DEMO_USER: AuthUser = {
  id: 1,
  email: 'marcus@bytevon.example',
  name: 'Marcus S.',
  role: 'Administrator',
  department: 'Operations',
}

function delay(ms = 600) {
  return new Promise((r) => setTimeout(r, ms))
}

function makeTokens(): AuthSession['tokens'] {
  const id = Math.random().toString(36).slice(2)
  return {
    accessToken: `access_${id}`,
    refreshToken: `refresh_${id}`,
    expiresIn: 600, // 10 min — matches V1 access JWT window
  }
}

export function loadStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function persistSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export async function loginApi(input: LoginInput): Promise<AuthSession> {
  await delay()

  // Mock: reject only a locked demo account
  if (input.email.toLowerCase() === 'locked@bytevon.example') {
    throw new Error('Account is temporarily locked. Try again later.')
  }

  if (!input.password || input.password.length < 1) {
    throw new Error('Invalid email or password.')
  }

  const session: AuthSession = {
    user: {
      ...DEMO_USER,
      email: input.email,
      name: input.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    tokens: makeTokens(),
  }
  persistSession(session)
  return session
}

export async function logoutApi(_revokeAll = false): Promise<void> {
  await delay(300)
  persistSession(null)
}

export async function refreshApi(refreshToken: string): Promise<AuthSession> {
  await delay(200)
  const current = loadStoredSession()
  if (!current || current.tokens.refreshToken !== refreshToken) {
    persistSession(null)
    throw new Error('SESSION_EXPIRED')
  }
  const next: AuthSession = {
    ...current,
    tokens: makeTokens(),
  }
  // keep same refresh family for mock simplicity
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
  map[token] = { email: input.email, exp: Date.now() + 10 * 60 * 1000 } // 5–10 min V1
  localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(map))
  // In real API the token is emailed; for mock we expose it in console for QA
  console.info('[auth mock] Password reset token (dev only):', token)
  return { message: 'If an account exists for that email, a reset link has been sent.' }
}

export async function resetPasswordApi(
  token: string,
  input: ResetPasswordInput
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
