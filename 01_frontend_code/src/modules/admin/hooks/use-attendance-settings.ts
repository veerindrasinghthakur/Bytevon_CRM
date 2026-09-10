import { useMemo } from 'react'
import type { ShiftRow } from '@/shared/schema'
import type { AttendanceSettingsInput } from '../schemas/settings'
import type { AttendanceSettings } from '../types'

const POLICY_DEFAULTS: Pick<
  AttendanceSettingsInput,
  | 'graceMinutes'
  | 'earlyOutMinutes'
  | 'otMinMinutes'
  | 'allowRemoteCheckIn'
  | 'correctionWindowDays'
  | 'maxCorrectionsPerMonth'
  | 'reasonsMandatory'
  | 'approvalSlaHours'
  | 'allowMultiplePunches'
  | 'requireCheckoutBeforeNewCheckin'
  | 'autoCreateAttendanceDay'
  | 'maxClockDriftSeconds'
> = {
  graceMinutes: 15,
  earlyOutMinutes: 30,
  otMinMinutes: 60,
  allowRemoteCheckIn: true,
  correctionWindowDays: 7,
  maxCorrectionsPerMonth: null,
  reasonsMandatory: true,
  approvalSlaHours: null,
  allowMultiplePunches: true,
  requireCheckoutBeforeNewCheckin: false,
  autoCreateAttendanceDay: true,
  maxClockDriftSeconds: null,
}

export function useShiftFormData(
  shifts: ShiftRow[],
  selectedShiftId: string,
  policy?: AttendanceSettings | null,
) {
  const policySlice = useMemo(() => {
    if (!policy) return { ...POLICY_DEFAULTS }
    return {
      graceMinutes: policy.graceMinutes ?? POLICY_DEFAULTS.graceMinutes,
      earlyOutMinutes: policy.earlyOutMinutes ?? POLICY_DEFAULTS.earlyOutMinutes,
      otMinMinutes: policy.otMinMinutes ?? POLICY_DEFAULTS.otMinMinutes,
      allowRemoteCheckIn: policy.allowRemoteCheckIn ?? POLICY_DEFAULTS.allowRemoteCheckIn,
      correctionWindowDays: policy.correctionWindowDays ?? POLICY_DEFAULTS.correctionWindowDays,
      maxCorrectionsPerMonth:
        policy.maxCorrectionsPerMonth ?? POLICY_DEFAULTS.maxCorrectionsPerMonth,
      reasonsMandatory: policy.reasonsMandatory ?? POLICY_DEFAULTS.reasonsMandatory,
      approvalSlaHours: policy.approvalSlaHours ?? POLICY_DEFAULTS.approvalSlaHours,
      allowMultiplePunches: policy.allowMultiplePunches ?? POLICY_DEFAULTS.allowMultiplePunches,
      requireCheckoutBeforeNewCheckin:
        policy.requireCheckoutBeforeNewCheckin ??
        POLICY_DEFAULTS.requireCheckoutBeforeNewCheckin,
      autoCreateAttendanceDay:
        policy.autoCreateAttendanceDay ?? POLICY_DEFAULTS.autoCreateAttendanceDay,
      maxClockDriftSeconds: policy.maxClockDriftSeconds ?? POLICY_DEFAULTS.maxClockDriftSeconds,
    }
  }, [policy])

  const shiftToForm = (s: ShiftRow): AttendanceSettingsInput => ({
    shiftStart: String(s.start_time).slice(0, 5),
    shiftEnd: String(s.end_time).slice(0, 5),
    ...policySlice,
    graceMinutes: s.grace_late_minutes ?? policySlice.graceMinutes,
  })

  const aggregateShifts = useMemo((): AttendanceSettingsInput => {
    if (!shifts.length) {
      return {
        shiftStart: '09:00',
        shiftEnd: '18:00',
        ...policySlice,
      }
    }
    const s = shifts[0]
    return {
      ...shiftToForm(s),
      graceMinutes: Math.max(
        ...shifts.map((x) => x.grace_late_minutes ?? policySlice.graceMinutes),
      ),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts, policySlice])

  const activeShift = useMemo(
    () => (selectedShiftId ? shifts.find((s) => String(s.id) === selectedShiftId) : null),
    [selectedShiftId, shifts],
  )

  const getFormValues = (): AttendanceSettingsInput => {
    if (selectedShiftId && activeShift) {
      return shiftToForm(activeShift)
    }
    if (shifts.length) {
      return {
        ...aggregateShifts,
        ...policySlice,
        graceMinutes: aggregateShifts.graceMinutes,
      }
    }
    return {
      shiftStart: '09:00',
      shiftEnd: '18:00',
      ...policySlice,
    }
  }

  return {
    shiftToForm,
    aggregateShifts,
    activeShift,
    getFormValues,
    policySlice,
  }
}
