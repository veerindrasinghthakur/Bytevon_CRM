import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import {
  getHolidayCalendars,
  getHolidays,
  getLocations,
  getOrganizationSettings,
  getPositions,
  getWorkingWeeks,
  restoreCalendar,
  updateOrganizationSettings,
} from '../../api/organization'
import type { OrganizationSettings } from '@/shared/schema'
import { useAdminMutation } from '../use-admin-mutation'
import { useDataScope } from '@/shared/rbac'

function withErrorMessage<T extends { isError: boolean; error: unknown }>(q: T) {
  return {
    ...q,
    errorMessage: q.isError ? getApiErrorMessage(q.error, 'Could not load data') : null,
  }
}

export function useOrganizationSettings() {
  return withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.settings(),
      queryFn: () => getOrganizationSettings(),
    }),
  )
}

export function useUpdateOrganizationSettings(options?: {
  onErrorMessage?: (msg: string) => void
}) {
  const qc = useQueryClient()
  return useAdminMutation({
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
    errorFallback: 'Could not save organization settings',
    onErrorMessage: options?.onErrorMessage,
    onSuccess: (row) => {
      qc.setQueryData(queryKeys.organization.settings(), row)
      qc.invalidateQueries({ queryKey: queryKeys.organization.settings() })
    },
  })
}

export function useOrgLocationsForSelect() {
  return withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.locations.list({ includeArchived: false }),
      queryFn: () => getLocations({ includeArchived: false }),
    }),
  )
}

export function useWorkingWeeks() {
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('working_week')
  return withErrorMessage(
    useQuery({
      queryKey: [...queryKeys.organization.workingWeeks(), scope],
      queryFn: getWorkingWeeks,
    }),
  )
}

export function useHolidayCalendars() {
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('holiday_calendar')
  return withErrorMessage(
    useQuery({
      queryKey: [...queryKeys.organization.holidays.list(), scope],
      queryFn: () => getHolidayCalendars(),
    }),
  )
}

export function useRestoreHolidayCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => restoreCalendar(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.holidays.all() })
    },
  })
}

export function useHolidays(calendarId?: number) {
  return withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.holidays.detail(calendarId ?? 0),
      queryFn: () => getHolidays(calendarId),
    }),
  )
}

export function usePositions(includeArchived = true) {
  return withErrorMessage(
    useQuery({
      queryKey: queryKeys.organization.positions({ includeArchived }),
      queryFn: () => getPositions({ includeArchived }),
    }),
  )
}
