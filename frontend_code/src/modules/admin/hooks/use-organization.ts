import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  getHolidayCalendars,
  getHolidays,
  getLocations,
  getOrganizationSettings,
  getPositions,
  getWorkingWeeks,
  updateOrganizationSettings,
} from '../api/organization'
import type { OrganizationSettings } from '@/shared/schema'

export function useOrganizationSettings() {
  return useQuery({
    queryKey: queryKeys.organization.settings(),
    queryFn: () => getOrganizationSettings(),
  })
}

export function useUpdateOrganizationSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
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
    ) => updateOrganizationSettings(patch),
    onSuccess: (row) => {
      qc.setQueryData(queryKeys.organization.settings(), row)
      qc.invalidateQueries({ queryKey: queryKeys.organization.settings() })
    },
    onError: () => {
      // Handled by consumer
    },
  })
}

export function useOrgLocationsForSelect() {
  return useQuery({
    queryKey: queryKeys.organization.locations.list({ includeArchived: false }),
    queryFn: () => getLocations({ includeArchived: false }),
  })
}

export function useWorkingWeeks() {
  return useQuery({
    queryKey: queryKeys.organization.workingWeeks(),
    queryFn: getWorkingWeeks,
  })
}

export function useHolidayCalendars() {
  return useQuery({
    queryKey: queryKeys.organization.holidays.list(),
    queryFn: getHolidayCalendars,
  })
}

export function useHolidays(calendarId?: number) {
  return useQuery({
    queryKey: queryKeys.organization.holidays.detail(calendarId ?? 0),
    queryFn: () => getHolidays(calendarId),
  })
}

export function usePositions(includeArchived = true) {
  return useQuery({
    queryKey: queryKeys.organization.positions({ includeArchived }),
    queryFn: () => getPositions({ includeArchived }),
  })
}
