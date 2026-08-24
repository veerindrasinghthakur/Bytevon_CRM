/**
 * Organization masters API — admin pattern: env.useMockApi branch.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type {
  HolidayCalendarRow,
  HolidayRow,
  LocationRow,
  OrganizationSettings,
  PositionRow,
  ShiftRow,
  WorkingWeekRow,
} from '@/shared/schema'

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().organization_settings[0]
    if (!row) throw new Error('Organization settings not configured')
    return { ...row }
  }
  const { data } = await apiClient.get<OrganizationSettings>('/organization/settings')
  return data
}

export async function updateOrganizationSettings(
  patch: Partial<
    Pick<
      OrganizationSettings,
      | 'company_name'
      | 'head_office_location_id'
      | 'default_timezone'
      | 'default_currency'
      | 'logo_reference'
    >
  >,
): Promise<OrganizationSettings> {
  if (env.useMockApi) {
    await delay(400)
    const row = getDb().organization_settings[0]
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<OrganizationSettings>('/organization/settings', patch)
  return data
}

export async function getLocations(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().locations.map((r) => ({ ...r }))
    if (!params?.includeArchived) items = items.filter((l) => !l.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<{ items: LocationRow[]; total: number }>('/organization/locations', {
    params,
  })
  return data
}

export async function getLocation(id: number): Promise<LocationRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().locations.find((l) => l.id === id)
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<LocationRow>(`/organization/locations/${id}`)
    return data
  } catch {
    return null
  }
}

export async function createLocation(
  input: Omit<LocationRow, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'changed_by'>,
): Promise<LocationRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().locations
    const row: LocationRow = {
      ...input,
      id: nextId(list),
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      changed_by: 1,
    }
    const fullRow: LocationRow = {
      ...row,
      payroll_region: row.payroll_region ?? '', // Ensure payroll_region is not undefined
    }
    list.push(fullRow as any)
    return { ...row }
  }
  const { data } = await apiClient.post<LocationRow>('/organization/locations', input)
  return data
}

export async function updateLocation(id: number, patch: Partial<LocationRow>): Promise<LocationRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = getDb().locations.find((l) => l.id === id)
    if (!row) throw new Error('Location not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<LocationRow>(`/organization/locations/${id}`, patch)
  return data
}

export async function getShifts(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().shifts.map((r) => ({ ...r }))
    if (!params?.includeArchived) items = items.filter((s) => !s.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<{ items: ShiftRow[]; total: number }>('/organization/shifts', {
    params,
  })
  return data
}

export async function getShift(id: number): Promise<ShiftRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().shifts.find((s) => s.id === id)
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<ShiftRow>(`/organization/shifts/${id}`)
    return data
  } catch {
    return null
  }
}

export async function createShift(
  input: Omit<ShiftRow, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'changed_by'>,
): Promise<ShiftRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().shifts
    const row: ShiftRow = {
      ...input,
      id: nextId(list),
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      changed_by: 1,
    }
    list.push(row as any)
    return { ...row }
  }
  const { data } = await apiClient.post<ShiftRow>('/organization/shifts', input)
  return data
}

export async function updateShift(id: number, patch: Partial<ShiftRow>): Promise<ShiftRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = getDb().shifts.find((s) => s.id === id)
    if (!row) throw new Error('Shift not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<ShiftRow>(`/organization/shifts/${id}`, patch)
  return data
}

export async function getWorkingWeeks() {
  if (env.useMockApi) {
    await delay()
    const items = getDb().working_weeks.map((r) => ({ ...r }) as WorkingWeekRow)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<{ items: WorkingWeekRow[]; total: number }>(
    '/organization/working-weeks',
  )
  return data
}

export async function getHolidayCalendars() {
  if (env.useMockApi) {
    await delay()
    const items = getDb().holiday_calendars.map((r) => ({ ...r }) as HolidayCalendarRow)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<{ items: HolidayCalendarRow[]; total: number }>(
    '/organization/holiday-calendars',
  )
  return data
}

export async function getHolidays(calendarId?: number) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().holidays.map((r) => ({ ...r }) as HolidayRow)
    if (calendarId != null) items = items.filter((h) => h.holiday_calendar_id === calendarId)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<{ items: HolidayRow[]; total: number }>('/organization/holidays', {
    params: calendarId != null ? { calendarId } : undefined,
  })
  return data
}

export async function getPositions(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().positions.map((r) => ({ ...r }) as PositionRow)
    if (!params?.includeArchived) items = items.filter((p) => !p.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<{ items: PositionRow[]; total: number }>('/organization/positions', {
    params,
  })
  return data
}

export async function getSchemaDepartments() {
  if (env.useMockApi) {
    await delay()
    const items = getDb().schema_departments.map((r) => ({ ...r }))
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<{ items: unknown[]; total: number }>('/organization/departments')
  return data
}
