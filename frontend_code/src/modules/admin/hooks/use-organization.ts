import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

const QK = ['organization'] as const

export function useOrganizationSettings() {
  return useQuery({
    queryKey: [...QK, 'settings'],
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
      qc.setQueryData([...QK, 'settings'], row)
      qc.invalidateQueries({ queryKey: [...QK, 'settings'] })
    },
    onError: () => {
      // Handled by consumer
    },
  })
}

export function useOrgLocationsForSelect() {
  return useQuery({
    queryKey: [...QK, 'locations', 'select'],
    queryFn: () => getLocations({ includeArchived: false }),
  })
}

export function useWorkingWeeks() {
  return useQuery({
    queryKey: [...QK, 'working-weeks'],
    queryFn: getWorkingWeeks,
  })
}

export function useHolidayCalendars() {
  return useQuery({
    queryKey: [...QK, 'holiday-calendars'],
    queryFn: getHolidayCalendars,
  })
}

export function useHolidays(calendarId?: number) {
  return useQuery({
    queryKey: [...QK, 'holidays', { calendarId }],
    queryFn: () => getHolidays(calendarId),
  })
}

export function usePositions(includeArchived = true) {
  return useQuery({
    queryKey: [...QK, 'positions', { includeArchived }],
    queryFn: () => getPositions({ includeArchived }),
  })
}
