/**
 * MSW handlers mirroring the backend error contract:
 *   { error: { code, message, details? } }  + legacy { detail } / { message }
 * Used by integration tests (Vitest, node) for HTTP-level coverage of
 * src/shared/lib/axios.ts interceptors and module API real-mode paths.
 */
import { http, HttpResponse } from 'msw'

const BASE = '*/api/v1'

export const handlers = [
  http.get(`${BASE}/health`, () => HttpResponse.json({ status: 'ok' })),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email === 'admin@bytevon.local' && body.password === 'ChangeMeAdmin!123') {
      return HttpResponse.json({
        tokens: { access_token: 'access_live', refresh_token: 'refresh_live', token_type: 'bearer', expires_in: 600 },
        login_id: 1,
        person_id: 1,
        email: body.email,
      })
    }
    return HttpResponse.json(
      { error: { code: 'unauthorized', message: 'Invalid credentials', details: null } },
      { status: 401 },
    )
  }),

  http.get(`${BASE}/rbac/roles`, ({ request }) => {
    if (!request.headers.get('authorization')) {
      return HttpResponse.json(
        { error: { code: 'unauthorized', message: 'Missing token', details: null } },
        { status: 401 },
      )
    }
    return HttpResponse.json({ items: [{ id: 1, name: 'Super Admin' }], total: 1 })
  }),

  http.get(`${BASE}/workforce/employments`, () =>
    HttpResponse.json({ items: [], total: 0 }),
  ),

  http.post(`${BASE}/leave/requests`, async ({ request }) => {
    const body = (await request.json()) as { start_date?: string }
    if (body.start_date === '2030-10-06') {
      return HttpResponse.json(
        {
          error: {
            code: 'domain_error',
            message: 'Leave range contains no working days (weekends/holidays only)',
            details: null,
          },
        },
        { status: 400 },
      )
    }
    return HttpResponse.json({ id: 1, approval_request_id: 10 }, { status: 201 })
  }),

  http.get(`${BASE}/approvals/pending`, () =>
    HttpResponse.json([{ id: '1', status: 'Pending' }]),
  ),

  // Legacy FastAPI shapes for parser coverage
  http.get(`${BASE}/legacy-detail`, () =>
    HttpResponse.json({ detail: 'Legacy gone' }, { status: 404 }),
  ),
  http.get(`${BASE}/legacy-validation`, () =>
    HttpResponse.json(
      { detail: [{ msg: 'Field required', loc: ['body', 'name'], type: 'missing' }] },
      { status: 422 },
    ),
  ),
]
