/**
 * Location API — admin domain (/admin/locations).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { LocationRow } from '@/shared/schema'
import { asList } from './_org-helpers'

export type LocationCreateInput = {
  name: string
  timezone: string
  latitude: number
  longitude: number
  attendance_radius_meters?: number
  allowed_ip_cidrs?: string[]
  country: string
  state: string
  city: string
  address: string
  payroll_region?: string | null
  currency: string
  fiscal_year_start_month?: number
  working_week_id?: number | null
  holiday_calendar_id?: number | null
}

function toCreateFields(input: LocationCreateInput | Record<string, unknown>): LocationCreateInput {
  const r = input as LocationCreateInput
  return {
    name: String(r.name ?? ''),
    timezone: String(r.timezone ?? 'UTC'),
    latitude: Number(r.latitude ?? 0),
    longitude: Number(r.longitude ?? 0),
    attendance_radius_meters: r.attendance_radius_meters ?? 200,
    allowed_ip_cidrs: Array.isArray(r.allowed_ip_cidrs) ? r.allowed_ip_cidrs : [],
    country: String(r.country ?? ''),
    state: String(r.state ?? ''),
    city: String(r.city ?? ''),
    address: String(r.address ?? ''),
    payroll_region: r.payroll_region ?? '',
    currency: String(r.currency ?? 'INR'),
    fiscal_year_start_month: r.fiscal_year_start_month ?? 4,
    working_week_id: r.working_week_id ?? null,
    holiday_calendar_id: r.holiday_calendar_id ?? null,
  }
}

export async function getLocations(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().locations.map((r) => ({ ...r }))
    if (!params?.includeArchived) items = items.filter((l) => !l.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<LocationRow[] | { items: LocationRow[]; total: number }>(
    '/admin/locations',
    { params: params?.includeArchived ? { include_archived: true } : undefined },
  )
  return asList(data)
}

export async function getLocation(id: number): Promise<LocationRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().locations.find((l) => l.id === id)
    return row ? { ...row } : null
  }
  const { data } = await apiClient.get<LocationRow>(`/admin/locations/${id}`)
  return data
}

export async function createLocation(input: LocationCreateInput | Record<string, unknown>): Promise<LocationRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().locations as LocationRow[]
    const fields = toCreateFields(input)
    const now = new Date().toISOString()
    const row: LocationRow = {
      ...fields,
      id: nextId(list),
      is_archived: false,
      created_at: now,
      updated_at: now,
      changed_by: 1,
      payroll_region: fields.payroll_region ?? '',
      attendance_radius_meters: fields.attendance_radius_meters ?? 200,
      allowed_ip_cidrs: fields.allowed_ip_cidrs ?? [],
      fiscal_year_start_month: fields.fiscal_year_start_month ?? 4,
      working_week_id: fields.working_week_id ?? 0,
      holiday_calendar_id: fields.holiday_calendar_id ?? 0,
      archived_at: null,
      archived_by: null,
    }
    list.push(row)
    return { ...row }
  }
  const body: Record<string, unknown> = { ...input }
  for (const key of ['working_week_id', 'holiday_calendar_id', 'payroll_region'] as const) {
    const v = body[key]
    if (v == null || v === '' || v === 0) delete body[key]
  }
  if (!Array.isArray(body.allowed_ip_cidrs)) body.allowed_ip_cidrs = []
  if (body.attendance_radius_meters == null) body.attendance_radius_meters = 200
  if (body.fiscal_year_start_month == null) body.fiscal_year_start_month = 1
  const { data } = await apiClient.post<LocationRow>('/admin/locations', body)
  return data
}

export async function updateLocation(id: number, patch: Partial<LocationRow> | Record<string, unknown>): Promise<LocationRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = (getDb().locations as LocationRow[]).find((l) => l.id === id)
    if (!row) throw new Error('Location not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const body: Record<string, unknown> = { ...patch }
  for (const key of ['working_week_id', 'holiday_calendar_id'] as const) {
    const v = body[key]
    if (v === 0 || v === '') body[key] = null
  }
  const { data } = await apiClient.patch<LocationRow>(`/admin/locations/${id}`, body)
  return data
}

export async function deleteLocation(id: number): Promise<void> {
  if (!env.useMockApi) {
    await apiClient.delete(`/admin/locations/${id}`)
    return
  }
  await delay(300)
  const row = (getDb().locations as LocationRow[]).find((l) => l.id === id)
  if (!row) throw new Error('Location not found')
  if (row.is_archived) throw new Error('Location is already deleted')
  const now = new Date().toISOString()
  row.is_archived = true
  row.archived_at = now
  row.archived_by = 1
  row.changed_by = 1
}

/** @deprecated Use deleteLocation (DELETE verb + soft-delete). */
export async function archiveLocation(id: number): Promise<void> {
  return deleteLocation(id)
}
