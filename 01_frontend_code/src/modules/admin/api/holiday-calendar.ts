/**
 * Holiday calendar + holidays API — admin organization domain.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import type { HolidayCalendarRow, HolidayRow } from '@/shared/schema'
import { asList } from './_org-helpers'

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
  const { data } = await apiClient.get<HolidayCalendarRow>(`/organization/holiday-calendars/${id}`)
  return data
}

export async function createHolidayCalendar(input: { name: string }): Promise<HolidayCalendarRow> {
  if (env.useMockApi) {
    await delay(400)
    const list = getDb().holiday_calendars as HolidayCalendarRow[]
    const now = new Date().toISOString()
    const row: HolidayCalendarRow = {
      id: nextId(list),
      name: input.name.trim(),
      is_archived: false,
      created_at: now,
      updated_at: now,
      changed_by: 1,
    }
    list.push(row)
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
    const row = (getDb().holiday_calendars as HolidayCalendarRow[]).find((c) => c.id === id)
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
    const list = getDb().holidays as HolidayRow[]
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
    list.push(row)
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
