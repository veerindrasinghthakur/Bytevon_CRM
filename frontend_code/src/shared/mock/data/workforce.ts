/** Canonical workforce UI seed — re-exports module seeds for shared consumers. */
export {
  attendanceKpis,
  weeklyAttendance,
  recentCheckIns,
  todayAttendance,
  corrections,
  attendanceLogs,
} from '@/modules/workforce/data/attendanceMock'

export {
  shifts,
  shiftEmployeesById,
  employeesOnShift,
  canCreateShift,
  type ShiftRow,
  type ShiftEmployee,
} from '@/modules/workforce/data/shiftsMock'
