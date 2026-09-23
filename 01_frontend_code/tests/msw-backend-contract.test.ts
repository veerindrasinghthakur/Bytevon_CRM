import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import axios, { type AxiosResponse } from 'axios'
import { server } from '@/test/msw-server'
import { parseApiError } from '@/shared/lib/api-error'

/**
 * HTTP-level integration: real axios requests against the MSW node server,
 * asserting the backend error contract ({error:{code,message}} + legacy
 * {detail} shapes) survives the wire and parses via parseApiError.
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const api = axios.create({ baseURL: 'http://test.local/api/v1' })

async function statusOf(p: Promise<AxiosResponse>): Promise<number> {
  try {
    const r = await p
    return r.status
  } catch (e) {
    return axios.isAxiosError(e) ? (e.response?.status ?? -1) : -1
  }
}

describe('msw backend contract', () => {
  it('logs in with seed admin and rejects bad credentials (401 envelope)', async () => {
    const ok = await api.post('/auth/login', {
      email: 'admin@bytevon.local',
      password: 'ChangeMeAdmin!123',
    })
    expect(ok.status).toBe(200)
    expect(ok.data.tokens.access_token).toBe('access_live')

    try {
      await api.post('/auth/login', { email: 'x@y.z', password: 'nope' })
      expect.unreachable('bad login must 401')
    } catch (e) {
      expect(axios.isAxiosError(e)).toBe(true)
      expect(parseApiError(e).code).toBe('unauthorized')
      expect(parseApiError(e).message).toBe('Invalid credentials')
    }
  })

  it('guards RBAC roles without a token and serves with one', async () => {
    expect(await statusOf(api.get('/rbac/roles'))).toBe(401)
    const authed = await api.get('/rbac/roles', { headers: { Authorization: 'Bearer t' } })
    expect(authed.status).toBe(200)
    expect(authed.data.total).toBe(1)
  })

  it('rejects weekend-only leave ranges with domain_error 400', async () => {
    try {
      await api.post('/leave/requests', { start_date: '2030-10-06' })
      expect.unreachable('weekend leave must 400')
    } catch (e) {
      const p = parseApiError(e)
      expect(p.status).toBe(400)
      expect(p.code).toBe('domain_error')
    }
  })

  it('serves legacy FastAPI shapes', async () => {
    expect(await statusOf(api.get('/legacy-detail'))).toBe(404)
    const v = await api.get('/legacy-validation').catch((e: unknown) => {
      if (axios.isAxiosError(e)) return e.response
      throw e
    })
    expect(v?.status).toBe(422)
    expect(Array.isArray(v?.data.detail)).toBe(true)
  })
})
