import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  getAttendanceDashboard,
  listTodayAttendance,
  getAttendanceById,
  getAttendanceDayDetail,
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
