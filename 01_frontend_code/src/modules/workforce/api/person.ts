/**
 * Person API — lightweight read/update client for /workforce/persons.
 * Person create flows through Employee (create person + employment in one
 * request); no standalone Person pages — Employee pages own that UI.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb } from '@/shared/mock/db'

export type Person = {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string | null
  personal_email: string | null
  personal_phone: string | null
  address: string | null
  is_anonymized: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type PersonUpdateInput = Partial<
  Pick<
    Person,
    'first_name' | 'last_name' | 'date_of_birth' | 'personal_email' | 'personal_phone' | 'address'
  >
>

function mapRow(r: Record<string, unknown>): Person {
  return {
    id: Number(r.id),
    first_name: String(r.first_name ?? ''),
    last_name: String(r.last_name ?? ''),
    date_of_birth: (r.date_of_birth as string | null) ?? null,
    personal_email: (r.personal_email as string | null) ?? null,
    personal_phone: (r.personal_phone as string | null) ?? null,
    address: (r.address as string | null) ?? null,
    is_anonymized: Boolean(r.is_anonymized ?? false),
    created_at: (r.created_at as string | null) ?? null,
    updated_at: (r.updated_at as string | null) ?? null,
  }
}

export async function listPersons(params?: {
  limit?: number
  offset?: number
}): Promise<Person[]> {
  if (env.useMockApi) {
    await delay()
    const rows = getDb().persons.slice(
      params?.offset ?? 0,
      (params?.offset ?? 0) + (params?.limit ?? 100),
    )
    return rows.map((p) => mapRow(p as unknown as Record<string, unknown>))
  }
  const { data } = await apiClient.get<unknown>('/workforce/persons', {
    params: { limit: params?.limit ?? 100, offset: params?.offset ?? 0 },
  })
  const rows = Array.isArray(data) ? data : []
  return (rows as Record<string, unknown>[]).map(mapRow)
}

export async function getPerson(id: number): Promise<Person | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().persons.find((p) => p.id === id)
    return row ? mapRow(row as unknown as Record<string, unknown>) : null
  }
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`/workforce/persons/${id}`)
    return mapRow(data)
  } catch {
    return null
  }
}

export async function updatePerson(id: number, patch: PersonUpdateInput): Promise<Person> {
  if (env.useMockApi) {
    await delay(300)
    const db = getDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = db.persons.find((p) => p.id === id) as any
    if (!row) throw new Error('Person not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return mapRow(row as Record<string, unknown>)
  }
  const { data } = await apiClient.patch<Record<string, unknown>>(
    `/workforce/persons/${id}`,
    patch,
  )
  return mapRow(data)
}
