import { useMemo } from 'react'
import type { ShiftRow } from '@/shared/schema'
import type { AttendanceSettingsInput } from '../schemas/settings'

export function useShiftFormData(shifts: ShiftRow[], selectedShiftId: string) {
  const shiftToForm = (s: ShiftRow): AttendanceSettingsInput => ({
    shiftStart: String(s.start_time).slice(0, 5),
    shiftEnd: String(s.end_time).slice(0, 5),
    graceMinutes: s.grace_late_minutes ?? 15,
    earlyOutMinutes: 30,
    otMinMinutes: 60,
    allowRemoteCheckIn: true,
  })

  const aggregateShifts = useMemo((): AttendanceSettingsInput => {
    if (!shifts.length) {
      return {
        shiftStart: '09:00',
        shiftEnd: '18:00',
        graceMinutes: 15,
        earlyOutMinutes: 30,
        otMinMinutes: 60,
        allowRemoteCheckIn: true,
      }
    }
    const s = shifts[0]
    return {
      ...shiftToForm(s),
      graceMinutes: Math.max(...shifts.map((x) => x.grace_late_minutes ?? 15)),
    }
  }, [shifts])

  const activeShift = useMemo(
    () => (selectedShiftId ? shifts.find((s) => String(s.id) === selectedShiftId) : null),
    [selectedShiftId, shifts]
  )

  const getFormValues = (): AttendanceSettingsInput => {
    if (selectedShiftId && activeShift) {
      return shiftToForm(activeShift)
    }
    if (shifts.length) {
      return aggregateShifts
    }
    return {
      shiftStart: '09:00',
      shiftEnd: '18:00',
      graceMinutes: 15,
      earlyOutMinutes: 30,
      otMinMinutes: 60,
      allowRemoteCheckIn: true,
    }
  }

  return {
    shiftToForm,
    aggregateShifts,
    activeShift,
    getFormValues,
  }
}