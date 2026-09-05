import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '@/shared/mock/db'
import {
  activateUser,
  archiveUserCredentials,
  createUserLogin,
  deactivateUser,
  getUserLogin,
  listAdminUsers,
  listEmploymentsWithoutLogin,
} from './users'

/**
 * Mock-mode tests: env.useMockApi defaults to true (no VITE_USE_MOCK_API in
 * test env), so every call below runs against the shared in-memory db.
 * Tests derive ids from the seed instead of hardcoding them.
 */

type TestDb = ReturnType<typeof getDb> & {
  login_users?: Array<{ id: number; employment_id: number; email: string }>
}

function firstEmploymentId(): number {
  const db = getDb() as TestDb
  expect(db.employments.length).toBeGreaterThan(0)
  const linked = new Set((db.login_users ?? []).map((l) => l.employment_id))
  const free = db.employments.find((e) => !linked.has(e.id))
  if (free) return free.id
  // Seed has every employment linked — add a synthetic one for the test
  const nextEmpId = Math.max(...db.employments.map((e) => e.id)) + 1
  ;(db.employments as unknown[]).push({
    id: nextEmpId,
    person_id: db.persons[0]?.id ?? 0,
    employee_code: `TEST-${nextEmpId}`,
    joining_date: '2026-01-01',
  } as never)
  return nextEmpId
}

function uniqueEmail(tag: string): string {
  return `test-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@bytevon.test`
}

beforeEach(() => {
  // Keep the shared store clean of previous test logins for this employment
  const db = getDb() as TestDb
  if (db.login_users) {
    db.login_users = db.login_users.filter((l) => !l.email.endsWith('@bytevon.test'))
  }
})

describe('listAdminUsers', () => {
  it('returns items with display fields mapped', async () => {
    const res = await listAdminUsers()
    expect(Array.isArray(res.items)).toBe(true)
    expect(res.total).toBe(res.items.length)
    expect(res.active + res.locked).toBeLessThanOrEqual(res.total)
    if (res.items.length) {
      const u = res.items[0]
      expect(u).toHaveProperty('name')
      expect(u).toHaveProperty('email')
      expect(['Active', 'Inactive', 'Locked']).toContain(u.status)
    }
  })

  it('filters by search term', async () => {
    const res = await listAdminUsers({ search: 'zzz-no-match-zzz' })
    expect(res.items).toHaveLength(0)
  })
})

describe('createUserLogin', () => {
  it('rejects an unknown employment', async () => {
    await expect(
      createUserLogin({
        employmentId: -99999,
        email: uniqueEmail('unknown-emp'),
        temporaryPassword: 'Secret@123',
        roleId: 0,
      }),
    ).rejects.toThrow(/Employment not found/)
  })

  it('creates a login and rejects duplicate emails case-insensitively', async () => {
    const employmentId = firstEmploymentId()
    const email = uniqueEmail('dup')

    const created = await createUserLogin({
      employmentId,
      email,
      temporaryPassword: 'Temp@123',
      roleId: 0,
    })
    expect(created.email).toBe(email)

    await expect(
      createUserLogin({
        employmentId,
        email: email.toUpperCase(),
        temporaryPassword: 'Temp@123',
        roleId: 0,
      }),
    ).rejects.toThrow(/already has a login|already in use/i)
  })

  it('is retrievable via getUserLogin afterwards', async () => {
    const employmentId = firstEmploymentId()
    const email = uniqueEmail('get')
    const created = await createUserLogin({
      employmentId,
      email,
      temporaryPassword: 'Temp@123',
      roleId: 0,
    })
    const detail = await getUserLogin(created.id)
    expect(detail?.display.email.toLowerCase()).toBe(email.toLowerCase())
  })
})

describe('deactivate / activate round-trip', () => {
  it('flips status both ways and resets lockout state on activate', async () => {
    const employmentId = firstEmploymentId()
    const created = await createUserLogin({
      employmentId,
      email: uniqueEmail('roundtrip'),
      temporaryPassword: 'Temp@123',
      roleId: 0,
    })

    await deactivateUser(created.id)
    let detail = await getUserLogin(created.id)
    expect(detail?.login.status).toBe('INACTIVE')

    await activateUser(created.id)
    detail = await getUserLogin(created.id)
    expect(detail?.login.status).toBe('ACTIVE')
    expect(detail?.login.failed_attempt_count).toBe(0)
    expect(detail?.login.locked_until).toBeNull()
  })
})

describe('archiveUserCredentials', () => {
  it('removes credentials so the employment shows as login-less again', async () => {
    const employmentId = firstEmploymentId()
    const before = await listEmploymentsWithoutLogin()
    const created = await createUserLogin({
      employmentId,
      email: uniqueEmail('archive'),
      temporaryPassword: 'Temp@123',
      roleId: 0,
    })

    const mid = await listEmploymentsWithoutLogin()
    expect(mid.some((e) => e.employmentId === employmentId)).toBe(false)

    await archiveUserCredentials(created.id)

    const after = await listEmploymentsWithoutLogin()
    expect(after.length).toBe(before.length)
    expect(after.some((e) => e.employmentId === employmentId)).toBe(true)
  })

  it('throws when archiving a non-existent login', async () => {
    await expect(archiveUserCredentials(-99999)).rejects.toThrow(/not found/i)
  })
})
