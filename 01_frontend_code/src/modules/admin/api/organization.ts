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

function asList<T>(data: T[] | { items?: T[]; total?: number } | null | undefined): {
  items: T[]
  total: number
} {
  if (Array.isArray(data)) return { items: data, total: data.length }
  if (data && typeof data === 'object' && Array.isArray((data as { items?: T[] }).items)) {
    const items = (data as { items: T[] }).items
    return { items, total: (data as { total?: number }).total ?? items.length }
  }
  return { items: [], total: 0 }
}

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
  const { data } = await apiClient.get<LocationRow[] | { items: LocationRow[]; total: number }>(
    '/organization/locations',
    {
      params: params?.includeArchived ? { include_archived: true } : undefined,
    },
  )
  return asList(data)
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

export async function createLocation(input: LocationCreateInput | Record<string, unknown>): Promise<LocationRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().locations
    const row: LocationRow = {
      ...(input as any),
      id: nextId(list),
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      changed_by: 1,
      payroll_region: (input as any).payroll_region ?? '',
      attendance_radius_meters: (input as any).attendance_radius_meters ?? 200,
      allowed_ip_cidrs: (input as any).allowed_ip_cidrs ?? [],
      fiscal_year_start_month: (input as any).fiscal_year_start_month ?? 4,
    }
    list.push(row as any)
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

  const { data } = await apiClient.post<LocationRow>('/organization/locations', body)
  return data
}

export async function updateLocation(id: number, patch: Partial<LocationRow> | Record<string, unknown>): Promise<LocationRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = getDb().locations.find((l) => l.id === id)
    if (!row) throw new Error('Location not found')
    Object.assign(row, patch, { updated_at: new Date().toISOString() })
    return { ...row }
  }
  const body: Record<string, unknown> = { ...patch }
  for (const key of ['working_week_id', 'holiday_calendar_id'] as const) {
    const v = body[key]
    if (v === 0 || v === '') body[key] = null
  }
  const { data } = await apiClient.patch<LocationRow>(`/organization/locations/${id}`, body)
  return data
}

export async function getShifts(params?: { includeArchived?: boolean }) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().shifts.map((r) => ({ ...r }))
    if (!params?.includeArchived) items = items.filter((s) => !s.is_archived)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<ShiftRow[] | { items: ShiftRow[]; total: number }>(
    '/organization/shifts',
    {
      params: params?.includeArchived ? { include_archived: true } : undefined,
    },
  )
  return asList(data)
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
  const { data } = await apiClient.get<WorkingWeekRow[] | { items: WorkingWeekRow[]; total: number }>(
    '/organization/working-weeks',
  )
  return asList(data)
}

export async function createWorkingWeek(input: {
  name: string
  working_days_of_week: number[]
  effective_from: string
}): Promise<WorkingWeekRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().working_weeks as WorkingWeekRow[]
    const row: WorkingWeekRow = {
      id: nextId(list),
      name: input.name.trim(),
      working_days_of_week: [...input.working_days_of_week],
      effective_from: input.effective_from,
      effective_to: null,
      created_at: new Date().toISOString(),
      created_by: 1,
    } as WorkingWeekRow
    for (const w of list) {
      if (w.effective_to == null) {
        ;(w as any).effective_to = input.effective_from
      }
    }
    list.push(row as any)
    return { ...row }
  }
  const { data } = await apiClient.post<WorkingWeekRow>('/organization/working-weeks', {
    name: input.name.trim(),
    working_days_of_week: input.working_days_of_week,
    effective_from: input.effective_from,
  })
  return data
}

export async function archiveWorkingWeek(id: number, effectiveTo?: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const row = (getDb().working_weeks as WorkingWeekRow[]).find((w) => w.id === id)
    if (!row) throw new Error('Working week not found')
    ;(row as any).effective_to = effectiveTo ?? new Date().toISOString().slice(0, 10)
    return
  }
  await apiClient.post(`/organization/working-weeks/${id}/archive`, null, {
    params: effectiveTo ? { effective_to: effectiveTo } : undefined,
  })
}

export async function deleteWorkingWeek(id: number): Promise<void> {
  return archiveWorkingWeek(id)
}

export async function getHolidayCalendars() {
  if (env.useMockApi) {
    await delay()
    const items = getDb().holiday_calendars.map((r) => ({ ...r }) as HolidayCalendarRow)
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<
    HolidayCalendarRow[] | { items: HolidayCalendarRow[]; total: number }
  >('/organization/holiday-calendars')
  return asList(data)
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

export async function archiveHolidayCalendar(id: number): Promise<void> {
  if (!env.useMockApi) {
    await apiClient.post(`/organization/holiday-calendars/${id}/archive`)
    return
  }
  return updateHolidayCalendar(id, { is_archived: true }).then(() => undefined)
}

export async function getHolidays(calendarId?: number) {
  if (env.useMockApi) {
    await delay()
    let items = getDb().holidays.map((r) => ({ ...r }) as HolidayRow)
    if (calendarId != null) items = items.filter((h) => h.holiday_calendar_id === calendarId)
    return { items, total: items.length }
  }
  if (calendarId != null) {
    const { data } = await apiClient.get<HolidayRow[] | { items: HolidayRow[]; total: number }>(
      `/organization/holiday-calendars/${calendarId}/holidays`,
    )
    return asList(data)
  }
  return { items: [], total: 0 }
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

export async function updateHoliday(
  id: number,
  patch: Partial<{
    name: string
    date: string
    holiday_type: HolidayRow['holiday_type']
    recurring_flag: boolean
    holiday_calendar_id: number
  }>,
): Promise<HolidayRow> {
  if (env.useMockApi) {
    await delay(400)
    const row = (getDb().holidays as HolidayRow[]).find((h) => h.id === id)
    if (!row) throw new Error('Holiday not found')
    Object.assign(row, patch)
    return { ...row }
  }
  const { data } = await apiClient.patch<HolidayRow>(`/organization/holidays/${id}`, patch)
  return data
}

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
  try {
    const { data } = await apiClient.get<PositionRow[] | { items: PositionRow[]; total: number }>(
      '/workforce/positions',
      { params },
    )
    return asList(data)
  } catch {
    return { items: [], total: 0 }
  }
}

export async function getPosition(id: number): Promise<PositionRow | null> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().positions.find((p) => p.id === id)
    return row ? { ...row } : null
  }
  try {
    const { data } = await apiClient.get<PositionRow>(`/workforce/positions/${id}`)
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
  const { data } = await apiClient.post<PositionRow>('/workforce/positions', input)
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
  const { data } = await apiClient.patch<PositionRow>(`/workforce/positions/${id}`, patch)
  return data
}

export async function archivePosition(id: number): Promise<void> {
  return updatePosition(id, { is_archived: true }).then(() => undefined)
}

export async function archiveLocation(id: number): Promise<void> {
  if (!env.useMockApi) {
    await apiClient.post(`/organization/locations/${id}/archive`)
    return
  }
  await delay(300)
  const row = getDb().locations.find((l) => l.id === id) as LocationRow | undefined
  if (!row) throw new Error('Location not found')
  if (row.is_archived) throw new Error('Location is already archived')
  const now = new Date().toISOString()
  row.is_archived = true
  row.archived_at = now
  row.archived_by = 1
  row.changed_by = 1
}

export async function getSchemaDepartments() {
  if (env.useMockApi) {
    await delay()
    const items = getDb().schema_departments.map((r) => ({ ...r }))
    return { items, total: items.length }
  }
  const { data } = await apiClient.get<unknown[] | { items: unknown[]; total: number }>(
    '/organization/departments',
  )
  return asList(data)
}
