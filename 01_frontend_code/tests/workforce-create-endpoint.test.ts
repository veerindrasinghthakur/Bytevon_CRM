import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw-server'
import { env } from '@/config/env'

/**
 * Phase A regressions:
 * 1. createEmployment must POST person-shaped payloads to /workforce/employees
 *    (one-shot onboarding). Posting them to /workforce/employments 422s
 *    (backend EmploymentCreate requires person_id + employee_code).
 * 2. listRoles must parse the paginated RoleListResponse {items} shape.
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  ;(env as { useMockApi: boolean }).useMockApi = true
  vi.restoreAllMocks()
})
afterAll(() => server.close())

function realMode() {
  ;(env as { useMockApi: boolean }).useMockApi = false
}

describe('createEmployment endpoint', () => {
  it('POSTs to /workforce/employees (not /workforce/employments)', async () => {
    realMode()
    let url = ''
    let body: Record<string, unknown> = {}
    server.use(
      http.post('*/api/v1/workforce/employees', async ({ request }) => {
        url = request.url
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          {
            id: 99,
            person_id: 50,
            employee_code: 'EMP-AUTO-1',
            employment_type: 'FULL_TIME',
            current_state: 'ONBOARDING',
            joining_date: '2024-06-01',
            created_at: '2024-06-01T00:00:00Z',
            updated_at: '2024-06-01T00:00:00Z',
            person: { id: 50, first_name: 'Asha', last_name: 'K' },
            current_assignment: null,
            recent_state_history: [],
          },
          { status: 201 },
        )
      }),
    )
    const { createEmployment } = await import('@/modules/workforce/api/employment')
    const created = await createEmployment({
      firstName: 'Asha',
      lastName: 'K',
      dateOfBirth: null,
      personalEmail: null,
      personalPhone: null,
      address: null,
      employmentType: 'FULL_TIME',
      joiningDate: '2024-06-01',
      departmentId: 1,
      positionId: 2,
      locationId: 3,
      shiftId: 4,
      create_login: false,
      login_email: null,
      login_temporary_password: null,
      login_role_id: null,
      bank: undefined,
    } as never)
    expect(url).toMatch(/\/workforce\/employees$/)
    expect(body).toMatchObject({ first_name: 'Asha', last_name: 'K', department_id: 1 })
    expect(created?.employment?.id).toBe(99)
    expect(created?.person?.first_name).toBe('Asha')
  })
})

describe('listRoles paginated shape', () => {
  it('parses {items} RoleListResponse into options', async () => {
    realMode()
    server.use(
      http.get('*/api/v1/rbac/roles', () =>
        HttpResponse.json({
          items: [{ id: 1, name: 'Super Admin' }],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      ),
    )
    const { listRoles } = await import('@/modules/admin/api/users')
    const roles = await listRoles()
    expect(roles).toEqual([{ id: '1', name: 'Super Admin', description: null }])
  })
})
