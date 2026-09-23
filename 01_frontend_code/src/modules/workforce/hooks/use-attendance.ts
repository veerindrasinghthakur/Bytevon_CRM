import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  decideCorrection,
  getAttendanceDashboard,
  listTodayAttendance,
  getAttendanceById,
  getAttendanceDayDetail,
  listDaysInRange,
  listPendingCorrections,
} from '../api/attendance'

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
  return useQuery({
    queryKey: queryKeys.workforce.attendance.today(params),
    queryFn: () => listTodayAttendance(params),
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

/** Org-wide day rows for an arbitrary date range (drives date picker + weeks). */
export function useAttendanceRange(fromDate: string | undefined, toDate: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.workforce.attendance.all, 'range', fromDate, toDate],
    queryFn: () => listDaysInRange(fromDate!, toDate!),
    enabled: Boolean(fromDate && toDate),
  })
}

export function usePendingCorrections() {
  return useQuery({
    queryKey: [...queryKeys.workforce.attendance.all, 'corrections', 'pending'],
    queryFn: listPendingCorrections,
  })
}

export function useDecideCorrection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      approvalRequestId,
      decision,
    }: {
      approvalRequestId: number
      decision: 'approve' | 'reject'
    }) => decideCorrection(approvalRequestId, decision),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.workforce.attendance.all })
    },
  })
}
