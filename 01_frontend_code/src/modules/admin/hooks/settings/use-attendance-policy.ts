import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getAttendanceSettings, updateAttendanceSettings } from '../../api/settings'
import { getAttendanceAdminMetrics } from '../../api/metrics'
import { getShifts, updateShift } from '../../api/organization'
import type { AttendanceSettingsInput } from '../../schemas/settings'

/** Attendance policy + metrics + shifts data with save mutation. */
export function useAttendancePolicy() {
  const qc = useQueryClient()

  const policyQuery = useQuery({
    queryKey: queryKeys.admin.settings.attendance(),
    queryFn: getAttendanceSettings,
  })
  const metricsQuery = useQuery({
    queryKey: queryKeys.admin.metrics.attendance(),
    queryFn: getAttendanceAdminMetrics,
  })
  const shiftsQuery = useQuery({
    queryKey: queryKeys.organization.shifts.list({ includeArchived: false }),
    queryFn: () => getShifts({ includeArchived: false }),
  })

  const saveMut = useMutation({
    mutationFn: async ({
      values,
      shiftId,
    }: {
      values: AttendanceSettingsInput
      shiftId?: string
    }) => {
      await updateAttendanceSettings(values)
      if (shiftId) {
        const start =
          values.shiftStart.length === 5 ? `${values.shiftStart}:00` : values.shiftStart
        const end = values.shiftEnd.length === 5 ? `${values.shiftEnd}:00` : values.shiftEnd
        await updateShift(Number(shiftId), {
          start_time: start,
          end_time: end,
          grace_late_minutes: values.graceMinutes,
        } as never)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.settings.attendance() })
      void qc.invalidateQueries({ queryKey: queryKeys.organization.shifts.all })
      void qc.invalidateQueries({ queryKey: queryKeys.admin.metrics.attendance() })
    },
  })

  // Memoized: a fresh `?? []` every render changed identity each pass,
  // retriggering the page's reset effect into an infinite update loop.
  const shifts = useMemo(() => shiftsQuery.data?.items ?? [], [shiftsQuery.data])

  return {
    policy: policyQuery.data,
    policyLoading: policyQuery.isLoading,
    policyError: policyQuery.error,
    refetchPolicy: policyQuery.refetch,
    metrics: metricsQuery.data,
    shifts,
    shiftsLoading: shiftsQuery.isLoading,
    savePolicy: saveMut.mutateAsync,
    isSaving: saveMut.isPending,
    saveError: saveMut.error,
  }
}
