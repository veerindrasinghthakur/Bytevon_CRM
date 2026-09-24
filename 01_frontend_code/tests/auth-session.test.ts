import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadStoredSession,
  loginApi,
  persistSession,
} from '@/modules/auth/api/auth'
import { MOCK_LOGIN_EMAIL, MOCK_LOGIN_PASSWORD } from '@/modules/auth/schemas/auth'

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('loginApi (mock mode)', () => {
  it('logs in with demo credentials and persists a session', async () => {
    const session = await loginApi({ email: MOCK_LOGIN_EMAIL, password: MOCK_LOGIN_PASSWORD })
    expect(session.tokens.accessToken).toBeTruthy()
    expect(session.tokens.refreshToken).toBeTruthy()
    expect(session.user.employmentId).toBe(1)
    persistSession(session)
    expect(loadStoredSession()?.user.email).toBeTruthy()
  })

  it('rejects wrong passwords', async () => {
    await expect(
      loginApi({ email: MOCK_LOGIN_EMAIL, password: 'wrong-password' }),
    ).rejects.toThrow()
  })
})

describe('session storage', () => {
  it('round-trips persist/load and clears on null', async () => {
    const session = await loginApi({ email: MOCK_LOGIN_EMAIL, password: MOCK_LOGIN_PASSWORD })
    persistSession(session)
    expect(loadStoredSession()?.tokens.accessToken).toBe(session.tokens.accessToken)
    persistSession(null)
    expect(loadStoredSession()).toBeNull()
  })

  it('returns null for corrupt entries', () => {
    sessionStorage.setItem('bytevon_auth_session', '{not-json')
    expect(loadStoredSession()).toBeNull()
  })
})
