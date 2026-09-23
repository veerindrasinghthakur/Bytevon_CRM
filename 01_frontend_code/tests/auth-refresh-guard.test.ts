import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw-server'
import { env } from '@/config/env'
import { persistSession } from '@/modules/auth/api/auth'
import { subscribeSessionExpired } from '@/shared/lib/session-expiry'

/**
 * Refresh-loop guard: a dead refresh token must not recurse (the old
 * interceptor retried /auth/refresh itself without bound and crashed tabs).
 * At most MAX_REFRESH_ATTEMPTS (=3) refresh calls, then session cleared +
 * expiry flow fires.
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  ;(env as { useMockApi: boolean }).useMockApi = false
  sessionStorage.clear()
  localStorage.clear()
})
afterEach(() => {
  server.resetHandlers()
  ;(env as { useMockApi: boolean }).useMockApi = true
  vi.restoreAllMocks()
})
afterAll(() => server.close())

function seedSession() {
  persistSession({
    user: {
      id: 1,
      username: 'a@b.c',
      email: 'a@b.c',
      name: 'T',
      role: 'R',
      department: 'D',
      employmentId: 1,
      personId: 1,
    },
    tokens: { accessToken: 'dead-access', refreshToken: 'dead-refresh', expiresIn: 0 },
  })
}

describe('refresh-loop guard', () => {
  it('never retries the refresh call itself (no recursion)', async () => {
    let refreshHits = 0
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        refreshHits += 1
        return HttpResponse.json(
          { error: { code: 'unauthorized', message: 'bad token', details: null } },
          { status: 401 },
        )
      }),
    )
    seedSession()
    const { apiClient } = await import('@/shared/lib/axios')
    await expect(apiClient.post('/auth/refresh', { refresh_token: 'dead-refresh' })).rejects.toThrow()
    expect(refreshHits).toBe(1)
  })

  it('shares one refresh across concurrent 401s, then clears session and fires expiry', async () => {
    // Three parallel dead-token requests: single-flight refresh (1 hit, no
    // amplification), all reject, session cleared, expiry fires.
    let refreshHits = 0
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        refreshHits += 1
        return HttpResponse.json(
          { error: { code: 'unauthorized', message: 'bad token', details: null } },
          { status: 401 },
        )
      }),
      http.get('*/api/v1/rbac/roles', () =>
        HttpResponse.json(
          { error: { code: 'unauthorized', message: 'nope', details: null } },
          { status: 401 },
        ),
      ),
    )
    seedSession()
    const fired: number[] = []
    const unsub = subscribeSessionExpired(() => fired.push(Date.now()))
    try {
      const { apiClient } = await import('@/shared/lib/axios')
      const results = await Promise.allSettled([
        apiClient.get('/rbac/roles'),
        apiClient.get('/rbac/roles'),
        apiClient.get('/rbac/roles'),
      ])
      expect(results.every((r) => r.status === 'rejected')).toBe(true)
      expect(refreshHits).toBe(1)
      expect(sessionStorage.getItem('bytevon_auth_session')).toBeNull()
      expect(fired.length).toBeGreaterThanOrEqual(1)
      // A later request with no session triggers no further refresh calls.
      await expect(apiClient.get('/rbac/roles')).rejects.toThrow()
      expect(refreshHits).toBe(1)
    } finally {
      unsub()
    }
  })
})
