/**
 * In-memory mock database.
 * Seeded once from mock-data.json. Mutations (create/update) hit this store only.
 * When real APIs land, delete this module and point api/* at the backend.
 */
import seed from './mock-data.json'

export type MockSeed = typeof seed

function clone<T>(value: T): T {
  return structuredClone(value)
}

/** Live store — starts as a deep copy of the JSON seed */
const db: MockSeed = clone(seed)

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
