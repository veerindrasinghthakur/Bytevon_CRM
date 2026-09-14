/**
 * Organization API barrel — re-exports domain APIs + org settings.
 * Prefer importing from domain files (location, shift, …) in new code.
 */
export { asList } from './_org-helpers'
export {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  archiveLocation,
  type LocationCreateInput,
} from './location'
export {
  getShifts,
  getShift,
  createShift,
  updateShift,
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
  archivePosition,
} from './position'
export { getSchemaDepartments } from './department'

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
