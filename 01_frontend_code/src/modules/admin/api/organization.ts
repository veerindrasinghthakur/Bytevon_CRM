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
      payroll_region: row.payroll_region ?? '',
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

/** Archive a shift (soft delete — sets is_archived). */
export async function archiveShift(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = getDb().shifts.find((s) => s.id === id)
    if (!row) throw new Error('Shift not found')
    row.is_archived = true
    return
  }
  await apiClient.post(`/organization/shifts/${id}/archive`)
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

/** Permanently remove a working week row. */
export async function deleteWorkingWeek(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const list = getDb().working_weeks as WorkingWeekRow[]
    const idx = list.findIndex((w) => w.id === id)
    if (idx < 0) throw new Error('Working week not found')
    list.splice(idx, 1)
    return
  }
  await apiClient.delete(`/organization/working-weeks/${id}`)
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

export async function getHolidayCalendar(id: number): Promise<HolidayCalendarRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().holiday_calendars.find((c) => c.id === id)
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<HolidayCalendarRow>(`/organization/holiday-calendars/${id}`)
    return data
  } catch {
    return null
  }
}

export async function createHolidayCalendar(input: { name: string }): Promise<HolidayCalendarRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().holiday_calendars
    const now = new Date().toISOString()
    const row: HolidayCalendarRow = {
      id: nextId(list),
      name: input.name.trim(),
      is_archived: false,
      created_at: now,
      updated_at: now,
      changed_by: 1,
    }
    list.push(row as any)
    return { ...row }
  }
  const { data } = await apiClient.post<HolidayCalendarRow>('/organization/holiday-calendars', input)
  return data
}

export async function updateHolidayCalendar(
  id: number,
  patch: Partial<Pick<HolidayCalendarRow, 'name' | 'is_archived'>>,
): Promise<HolidayCalendarRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = getDb().holiday_calendars.find((c) => c.id === id)
    if (!row) throw new Error('Calendar not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<HolidayCalendarRow>(
    `/organization/holiday-calendars/${id}`,
    patch,
  )
  return data
}

/** Archive a holiday calendar (soft delete). */
export async function archiveHolidayCalendar(id: number): Promise<void> {
  return updateHolidayCalendar(id, { is_archived: true }).then(() => undefined)
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

export async function createHoliday(input: {
  holiday_calendar_id: number
  name: string
  date: string
  holiday_type: HolidayRow['holiday_type']
  recurring_flag: boolean
}): Promise<HolidayRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().holidays
    const row: HolidayRow = {
      id: nextId(list),
      holiday_calendar_id: input.holiday_calendar_id,
      name: input.name.trim(),
      date: input.date,
      holiday_type: input.holiday_type,
      recurring_flag: input.recurring_flag,
      created_at: new Date().toISOString(),
      changed_by: 1,
    }
    list.push(row as any)
    return { ...row }
  }
  const { data } = await apiClient.post<HolidayRow>('/organization/holidays', input)
  return data
}

/** Permanently remove a holiday row. */
export async function deleteHoliday(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const list = getDb().holidays as HolidayRow[]
    const idx = list.findIndex((h) => h.id === id)
    if (idx < 0) throw new Error('Holiday not found')
    list.splice(idx, 1)
    return
  }
  await apiClient.delete(`/organization/holidays/${id}`)
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

export async function getPosition(id: number): Promise<PositionRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().positions.find((p) => p.id === id)
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<PositionRow>(`/organization/positions/${id}`)
    return data
  } catch {
    return null
  }
}

export async function createPosition(input: { name: string }): Promise<PositionRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().positions
    const now = new Date().toISOString()
    const row: PositionRow = {
      id: nextId(list),
      name: input.name.trim(),
      is_archived: false,
      created_at: now,
      updated_at: now,
    }
    list.push(row as any)
    return { ...row }
  }
  const { data } = await apiClient.post<PositionRow>('/organization/positions', input)
  return data
}

export async function updatePosition(
  id: number,
  patch: Partial<Pick<PositionRow, 'name' | 'is_archived'>>,
): Promise<PositionRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = getDb().positions.find((p) => p.id === id)
    if (!row) throw new Error('Position not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const { data } = await apiClient.patch<PositionRow>(`/organization/positions/${id}`, patch)
  return data
}

/** Archive a position (soft delete). */
export async function archivePosition(id: number): Promise<void> {
  return updatePosition(id, { is_archived: true }).then(() => undefined)
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
