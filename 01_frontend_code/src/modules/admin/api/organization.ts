/**
 * Admin org masters barrel — re-exports domain APIs + settings.
 * Prefer importing from domain files (location, shift, …) in new code.
 * All real API paths are under /admin/*.
 */
export { asList } from './_org-helpers'
export {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  restoreLocation,
  archiveLocation,
  type LocationCreateInput,
} from './location'
export {
  getShifts,
  getShift,
  createShift,
  updateShift,
  deleteShift,
  restoreShift,
  archiveShift,
} from './shift'
export {
  getWorkingWeeks,
  createWorkingWeek,
  archiveWorkingWeek,
  deleteWorkingWeek,
} from './working-week'
export {
  getHolidayCalendars,
  getHolidayCalendar,
  createHolidayCalendar,
  updateHolidayCalendar,
  deleteHolidayCalendar,
  restoreCalendar,
  restoreHolidayCalendar,
  archiveHolidayCalendar,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from './holiday-calendar'
export {
  getPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
  restorePosition,
  archivePosition,
} from './position'
export { listDepartments as getSchemaDepartments } from '@/modules/workforce/api/departments'

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb } from '@/shared/mock/db'
import type { OrganizationSettings } from '@/shared/schema'

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  if (env.useMockApi) {
    await delay()
    const row = getDb().organization_settings[0]
    if (!row) throw new Error('Organization settings not configured')
    return { ...row }
  }
  const { data } = await apiClient.get<OrganizationSettings>('/admin/settings')
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
  const { data } = await apiClient.patch<OrganizationSettings>('/admin/settings', patch)
  return data
}
