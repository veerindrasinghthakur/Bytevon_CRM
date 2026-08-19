/**
 * Organization masters API (mock via getDb).
 * Swap implementations for real HTTP later — pages stay unchanged.
 */

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
  await delay()
  const row = getDb().organization_settings[0]
  if (!row) throw new Error('Organization settings not configured')
  return { ...row }
}

export async function updateOrganizationSettings(
  patch: Partial<Pick<OrganizationSettings, 'company_name' | 'head_office_location_id' | 'default_timezone' | 'default_currency' | 'logo_reference'>>,
): Promise<OrganizationSettings> {
  await delay(400)
  const row = getDb().organization_settings[0]
  Object.assign(row, patch, { updated_at: new Date().toISOString() })
  return { ...row }
}

export async function getLocations(params?: { includeArchived?: boolean }) {
  await delay()
  let items = getDb().locations.map((r) => ({ ...r }))
  if (!params?.includeArchived) items = items.filter((l) => !l.is_archived)
  return { items, total: items.length }
}

export async function getLocation(id: number): Promise<LocationRow | null> {
  await delay()
  const row = getDb().locations.find((l) => l.id === id)
  return row ? { ...row } : null
}

export async function createLocation(
  input: Omit<LocationRow, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'changed_by'>,
): Promise<LocationRow> {
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
  list.push(row)
  return { ...row }
}

export async function updateLocation(
  id: number,
  patch: Partial<LocationRow>,
): Promise<LocationRow> {
  await delay(400)
  const row = getDb().locations.find((l) => l.id === id)
  if (!row) throw new Error('Location not found')
  Object.assign(row, patch, { updated_at: new Date().toISOString() })
  return { ...row }
}

export async function getShifts(params?: { includeArchived?: boolean }) {
  await delay()
  let items = getDb().shifts.map((r) => ({ ...r }))
  if (!params?.includeArchived) items = items.filter((s) => !s.is_archived)
  return { items, total: items.length }
}

export async function getWorkingWeeks() {
  await delay()
  const items = getDb().working_weeks.map((r) => ({ ...r }) as WorkingWeekRow)
  return { items, total: items.length }
}

export async function getHolidayCalendars() {
  await delay()
  const items = getDb().holiday_calendars.map((r) => ({ ...r }) as HolidayCalendarRow)
  return { items, total: items.length }
}

export async function getHolidays(calendarId?: number) {
  await delay()
  let items = getDb().holidays.map((r) => ({ ...r }) as HolidayRow)
  if (calendarId != null) items = items.filter((h) => h.holiday_calendar_id === calendarId)
  return { items, total: items.length }
}

export async function getPositions(params?: { includeArchived?: boolean }) {
  await delay()
  let items = getDb().positions.map((r) => ({ ...r }) as PositionRow)
  if (!params?.includeArchived) items = items.filter((p) => !p.is_archived)
  return { items, total: items.length }
}

export async function getSchemaDepartments() {
  await delay()
  const items = getDb().schema_departments.map((r) => ({ ...r }))
  return { items, total: items.length }
}
