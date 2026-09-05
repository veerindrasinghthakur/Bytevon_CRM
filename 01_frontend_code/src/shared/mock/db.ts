/**
 * In-memory mock database.
 * Seeded once from mock-data.json + schema-seed.
 * Mutations hit this store only. When real APIs land, point api/* at the backend.
 */
import seed from './mock-data.json'
import { schemaSeed, buildSuperAdminRolePermissions } from './schema-seed'

export type MockSeed = typeof seed & typeof schemaSeed

function clone<T>(value: T): T {
  return structuredClone(value)
}

const merged = {
  ...clone(seed),
  ...clone(schemaSeed),
} as MockSeed

// Wire Super Admin role_permissions from generated permission matrix
merged.role_permissions = buildSuperAdminRolePermissions(merged.permissions)

/** Live store */
const db: MockSeed = merged

export function getDb(): MockSeed {
  return db
}

export function delay(ms = 350): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function nextId(list: { id: number }[]): number {
  const max = list.reduce((m, row) => Math.max(m, row.id), 0)
  return max + 1
}
