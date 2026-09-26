import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'
import {
  decideCorrection,
  getAttendanceDashboard,
  listTodayAttendance,
  getAttendanceById,
  getAttendanceDayDetail,
  listDaysInRange,
  listPendingCorrections,
} from '../api/attendance'
import { useDataScope, useScopeParams } from '@/shared/rbac'

export function useAttendanceDashboard(params?: {
  employment_id?: number
  from_date?: string
  to_date?: string
  year?: number
  month?: number
}) {
  return useQuery({
    queryKey: queryKeys.workforce.attendance.dashboard(params),
    queryFn: () => getAttendanceDashboard(params),
  })
}

export function useTodayAttendance(params?: { search?: string; status?: string }) {
  // Scope-tagged: backend enforces the boundary; key stays partitioned per scope.
  const scopedParams = useScopeParams('attendance', params ?? {})
  return useQuery({
    queryKey: queryKeys.workforce.attendance.today(scopedParams),
    queryFn: () => listTodayAttendance(scopedParams),
  })
}

export function useAttendanceDetail(attendanceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workforce.attendance.detail(attendanceId ?? ''),
    queryFn: () => getAttendanceById(attendanceId!),
    enabled: Boolean(attendanceId),
  })
}

export function useAttendanceDayDetail(employmentId: string | undefined, date: string) {
  return useQuery({
    queryKey: queryKeys.workforce.attendance.day(employmentId ?? '', date),
    queryFn: () => getAttendanceDayDetail(employmentId!, date),
    enabled: Boolean(employmentId),
  })
}

/** Day rows for an arbitrary date range (backend scope-filters; drives date picker + weeks). */
export function useAttendanceRange(fromDate: string | undefined, toDate: string | undefined) {
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('attendance')
  return useQuery({
    queryKey: [...queryKeys.workforce.attendance.all, 'range', fromDate, toDate, scope],
    queryFn: () => listDaysInRange(fromDate!, toDate!),
    enabled: Boolean(fromDate && toDate),
  })
}

export function usePendingCorrections() {
  // Cache partitioned per data boundary; backend enforces from auth token.
  const scope = useDataScope('attendance')
  return useQuery({
    queryKey: [...queryKeys.workforce.attendance.all, 'corrections', 'pending', scope],
    queryFn: listPendingCorrections,
  })
}

export function useDecideCorrection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      approvalRequestId,
      decision,
      reason,
    }: {
      approvalRequestId: number
      decision: 'approve' | 'reject'
      reason?: string
    }) => decideCorrection(approvalRequestId, decision, reason),
    onSuccess: (_v, input) => {
      void qc.invalidateQueries({ queryKey: queryKeys.workforce.attendance.all })
      toast.success(
        input.decision === 'approve' ? 'Correction approved' : 'Correction rejected',
      )
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not decide the correction'))
    },
  })
}
