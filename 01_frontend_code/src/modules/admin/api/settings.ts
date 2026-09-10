/**
 * Admin settings API — organisation profile, attendance policy, leave accrual.
 *
 * Attendance:
 *   GET  /attendance/policies/current
 *   POST /attendance/policies  (new effective version)
 * Shift times (when a shift is selected):
 *   PATCH /organization/shifts/{id}
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import {
  attendanceSettingsMock,
  leaveAccrualPolicyMock,
  organizationProfileMock,
} from '../data/mock'
import type {
  AttendanceSettings,
  LeaveAccrualPolicy,
  OrganizationProfile,
} from '../types'
import { delay } from '@/shared/mock/db'
import { listLeavePolicies } from './leave'

const ORG_SETTINGS_API = '/organization/settings'
const ATTENDANCE_POLICY_CURRENT = '/attendance/policies/current'
const ATTENDANCE_POLICIES = '/attendance/policies'

type OrgSettingsApi = {
  id?: number
  company_name?: string
  companyName?: string
  head_office_location_id?: number | null
  headOfficeLocationId?: number | null
  default_timezone?: string
  defaultTimezone?: string
  default_currency?: string
  defaultCurrency?: string
  logo_reference?: string | null
  logoReference?: string | null
  legal_name?: string | null
  legalName?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  tax_id?: string | null
  taxId?: string | null
  registration_no?: string | null
  registrationNo?: string | null
  description?: string | null
}

/** Backend AttendancePolicyResponse */
export type AttendancePolicyApi = {
  id?: number
  name?: string
  correction_window_days?: number
  max_corrections_per_month?: number | null
  reasons_mandatory?: boolean
  approval_sla_hours?: number | null
  allow_multiple_punches?: boolean
  require_checkout_before_new_checkin?: boolean
  auto_create_attendance_day?: boolean
  default_grace_late_minutes?: number | null
  max_clock_drift_seconds?: number | null
  effective_from?: string
  effective_to?: string | null
}

export const DEFAULT_ATTENDANCE: AttendanceSettings = {
  shiftStart: '09:00',
  shiftEnd: '18:00',
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
  policyName: 'Company attendance policy',
  policyId: null,
  effectiveFrom: null,
}

function mapApiToProfile(row: OrgSettingsApi | null | undefined): OrganizationProfile {
  if (!row || typeof row !== 'object') {
    return {
      name: '',
      legal: '',
      email: '',
      phone: '',
      website: '',
      tax: '',
      reg: '',
      description: '',
      defaultTimezone: '',
      defaultCurrency: '',
      headOfficeLocationId: null,
      logoReference: null,
    }
  }

  return {
    name: String(row.company_name ?? row.companyName ?? ''),
    legal: String(row.legal_name ?? row.legalName ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    website: String(row.website ?? ''),
    tax: String(row.tax_id ?? row.taxId ?? ''),
    reg: String(row.registration_no ?? row.registrationNo ?? ''),
    description: String(row.description ?? ''),
    defaultTimezone: String(row.default_timezone ?? row.defaultTimezone ?? ''),
    defaultCurrency: String(row.default_currency ?? row.defaultCurrency ?? ''),
    headOfficeLocationId:
      row.head_office_location_id ?? row.headOfficeLocationId ?? null,
    logoReference: row.logo_reference ?? row.logoReference ?? null,
  }
}

function mapProfileToApi(patch: Partial<OrganizationProfile>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (patch.name != null) body.company_name = patch.name
  if (patch.defaultTimezone != null) body.default_timezone = patch.defaultTimezone
  if (patch.defaultCurrency != null) body.default_currency = patch.defaultCurrency
  if (patch.headOfficeLocationId !== undefined) {
    body.head_office_location_id = patch.headOfficeLocationId
  }
  if (patch.logoReference !== undefined) body.logo_reference = patch.logoReference
  return body
}

export function mapPolicyToAttendanceSettings(
  policy: AttendancePolicyApi | null,
): AttendanceSettings {
  if (!policy) return { ...DEFAULT_ATTENDANCE }
  return {
    ...DEFAULT_ATTENDANCE,
    graceMinutes:
      policy.default_grace_late_minutes != null
        ? Number(policy.default_grace_late_minutes)
        : DEFAULT_ATTENDANCE.graceMinutes,
    correctionWindowDays:
      policy.correction_window_days != null
        ? Number(policy.correction_window_days)
        : DEFAULT_ATTENDANCE.correctionWindowDays,
    maxCorrectionsPerMonth:
      policy.max_corrections_per_month != null
        ? Number(policy.max_corrections_per_month)
        : null,
    reasonsMandatory: policy.reasons_mandatory ?? true,
    approvalSlaHours:
      policy.approval_sla_hours != null ? Number(policy.approval_sla_hours) : null,
    allowMultiplePunches: policy.allow_multiple_punches ?? true,
    requireCheckoutBeforeNewCheckin: policy.require_checkout_before_new_checkin ?? false,
    autoCreateAttendanceDay: policy.auto_create_attendance_day ?? true,
    maxClockDriftSeconds:
      policy.max_clock_drift_seconds != null
        ? Number(policy.max_clock_drift_seconds)
        : null,
    policyName: policy.name ?? DEFAULT_ATTENDANCE.policyName,
    policyId: policy.id ?? null,
    effectiveFrom: policy.effective_from ?? null,
  }
}

/** Build AttendancePolicyCreate body from form + current policy defaults. */
export function toAttendancePolicyCreateBody(
  patch: Partial<AttendanceSettings>,
  current: AttendancePolicyApi | null,
): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10)
  const grace =
    patch.graceMinutes ??
    current?.default_grace_late_minutes ??
    DEFAULT_ATTENDANCE.graceMinutes

  return {
    name: patch.policyName ?? current?.name ?? 'Company attendance policy',
    correction_window_days:
      patch.correctionWindowDays ??
      current?.correction_window_days ??
      DEFAULT_ATTENDANCE.correctionWindowDays,
    max_corrections_per_month:
      patch.maxCorrectionsPerMonth !== undefined
        ? patch.maxCorrectionsPerMonth
        : (current?.max_corrections_per_month ?? null),
    reasons_mandatory:
      patch.reasonsMandatory ?? current?.reasons_mandatory ?? true,
    approval_sla_hours:
      patch.approvalSlaHours !== undefined
        ? patch.approvalSlaHours
        : (current?.approval_sla_hours ?? null),
    allow_multiple_punches:
      patch.allowMultiplePunches ?? current?.allow_multiple_punches ?? true,
    require_checkout_before_new_checkin:
      patch.requireCheckoutBeforeNewCheckin ??
      current?.require_checkout_before_new_checkin ??
      false,
    auto_create_attendance_day:
      patch.autoCreateAttendanceDay ?? current?.auto_create_attendance_day ?? true,
    default_grace_late_minutes: grace,
    max_clock_drift_seconds:
      patch.maxClockDriftSeconds !== undefined
        ? patch.maxClockDriftSeconds
        : (current?.max_clock_drift_seconds ?? null),
    effective_from: today,
  }
}

export async function getOrganizationProfile(): Promise<OrganizationProfile> {
  if (env.useMockApi) {
    await delay()
    return { ...organizationProfileMock }
  }
  const { data } = await apiClient.get<OrgSettingsApi>(ORG_SETTINGS_API)
  return mapApiToProfile(data)
}

export async function updateOrganizationProfile(
  patch: Partial<OrganizationProfile>,
): Promise<OrganizationProfile> {
  if (env.useMockApi) {
    await delay(400)
    Object.assign(organizationProfileMock, patch)
    return { ...organizationProfileMock }
  }
  const { data } = await apiClient.patch<OrgSettingsApi>(
    ORG_SETTINGS_API,
    mapProfileToApi(patch),
  )
  return mapApiToProfile(data)
}

export async function getAttendanceSettings(): Promise<AttendanceSettings> {
  if (env.useMockApi) {
    await delay()
    return { ...DEFAULT_ATTENDANCE, ...attendanceSettingsMock }
  }
  try {
    const { data } = await apiClient.get<AttendancePolicyApi>(ATTENDANCE_POLICY_CURRENT)
    return mapPolicyToAttendanceSettings(data)
  } catch {
    // No policy yet — return safe defaults (page still usable)
    return { ...DEFAULT_ATTENDANCE }
  }
}

/**
 * Creates a new attendance policy version (effective_from = today).
 * Maps to POST /attendance/policies (AttendancePolicyCreate).
 */
export async function updateAttendanceSettings(
  patch: Partial<AttendanceSettings>,
): Promise<AttendanceSettings> {
  if (env.useMockApi) {
    await delay(400)
    Object.assign(attendanceSettingsMock, patch)
    return { ...DEFAULT_ATTENDANCE, ...attendanceSettingsMock }
  }

  let current: AttendancePolicyApi | null = null
  try {
    const res = await apiClient.get<AttendancePolicyApi>(ATTENDANCE_POLICY_CURRENT)
    current = res.data
  } catch {
    current = null
  }

  const body = toAttendancePolicyCreateBody(patch, current)
  const { data } = await apiClient.post<AttendancePolicyApi>(ATTENDANCE_POLICIES, body)
  return mapPolicyToAttendanceSettings(data)
}

export async function getLeaveAccrualPolicy(): Promise<LeaveAccrualPolicy> {
  if (env.useMockApi) {
    await delay()
    return { ...leaveAccrualPolicyMock }
  }
  try {
    const policies = await listLeavePolicies()
    const current = policies.filter((p) => p.effective_to == null)
    const maxCarry = current.reduce(
      (m, p) => Math.max(m, Number(p.carry_forward_limit) || 0),
      0,
    )
    return {
      maxCarryOverDays: maxCarry,
      minimumNoticeDays: leaveAccrualPolicyMock.minimumNoticeDays ?? 0,
    }
  } catch {
    return { maxCarryOverDays: 0, minimumNoticeDays: 0 }
  }
}

export async function updateLeaveAccrualPolicy(
  patch: Partial<LeaveAccrualPolicy>,
): Promise<LeaveAccrualPolicy> {
  if (env.useMockApi) {
    await delay(400)
    Object.assign(leaveAccrualPolicyMock, patch)
    return { ...leaveAccrualPolicyMock }
  }
  const current = await getLeaveAccrualPolicy()
  return {
    maxCarryOverDays: patch.maxCarryOverDays ?? current.maxCarryOverDays,
    minimumNoticeDays: patch.minimumNoticeDays ?? current.minimumNoticeDays,
  }
}
