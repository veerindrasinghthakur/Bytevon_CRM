/**
 * Admin settings API — organisation profile, attendance policy, leave accrual.
 * Mock/real switch; pages use TanStack Query only.
 *
 * Backend GET/PATCH /organization/settings returns:
 *   { id, company_name, head_office_location_id, default_timezone,
 *     default_currency, logo_reference, created_at, updated_at, changed_by }
 *
 * Attendance: there is NO /admin/settings/attendance.
 * Company policy lives at GET/POST /attendance/policies (+ /policies/current).
 * Shift start/end/grace also live on organization shifts.
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

const ORG_SETTINGS_API = '/organization/settings'
const ATTENDANCE_POLICY_CURRENT = '/attendance/policies/current'
const ATTENDANCE_POLICIES = '/attendance/policies'

/** Raw backend organization_settings row. */
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

type AttendancePolicyApi = {
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

const DEFAULT_ATTENDANCE: AttendanceSettings = {
  shiftStart: '09:00',
  shiftEnd: '18:00',
  graceMinutes: 15,
  earlyOutMinutes: 30,
  otMinMinutes: 60,
  allowRemoteCheckIn: true,
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

function mapPolicyToAttendanceSettings(policy: AttendancePolicyApi | null): AttendanceSettings {
  if (!policy) return { ...DEFAULT_ATTENDANCE }
  return {
    ...DEFAULT_ATTENDANCE,
    graceMinutes:
      policy.default_grace_late_minutes != null
        ? Number(policy.default_grace_late_minutes)
        : DEFAULT_ATTENDANCE.graceMinutes,
  }
}

// ── Organisation profile ─────────────────────────────────────────────

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

// ── Attendance company policy ────────────────────────────────────────
// Backend: GET /attendance/policies/current, POST /attendance/policies (versioned)

export async function getAttendanceSettings(): Promise<AttendanceSettings> {
  if (env.useMockApi) {
    await delay()
    return { ...attendanceSettingsMock }
  }
  try {
    const { data } = await apiClient.get<AttendancePolicyApi>(ATTENDANCE_POLICY_CURRENT)
    return mapPolicyToAttendanceSettings(data)
  } catch {
    // No current policy yet — UI still works from shifts
    return { ...DEFAULT_ATTENDANCE }
  }
}

export async function updateAttendanceSettings(
  patch: Partial<AttendanceSettings>,
): Promise<AttendanceSettings> {
  if (env.useMockApi) {
    await delay(400)
    Object.assign(attendanceSettingsMock, patch)
    return { ...attendanceSettingsMock }
  }

  // Versioned policy: create a new effective version (no PATCH on current)
  const today = new Date().toISOString().slice(0, 10)
  let current: AttendancePolicyApi | null = null
  try {
    const res = await apiClient.get<AttendancePolicyApi>(ATTENDANCE_POLICY_CURRENT)
    current = res.data
  } catch {
    current = null
  }

  const grace =
    patch.graceMinutes ??
    current?.default_grace_late_minutes ??
    DEFAULT_ATTENDANCE.graceMinutes

  const body = {
    name: current?.name ?? 'Company attendance policy',
    correction_window_days: current?.correction_window_days ?? 7,
    max_corrections_per_month: current?.max_corrections_per_month ?? null,
    reasons_mandatory: current?.reasons_mandatory ?? true,
    approval_sla_hours: current?.approval_sla_hours ?? null,
    allow_multiple_punches: current?.allow_multiple_punches ?? true,
    require_checkout_before_new_checkin:
      current?.require_checkout_before_new_checkin ?? false,
    auto_create_attendance_day: current?.auto_create_attendance_day ?? true,
    default_grace_late_minutes: grace,
    max_clock_drift_seconds: current?.max_clock_drift_seconds ?? null,
    effective_from: today,
  }

  const { data } = await apiClient.post<AttendancePolicyApi>(ATTENDANCE_POLICIES, body)
  return mapPolicyToAttendanceSettings(data)
}

// ── Leave accrual policy (company-wide) ──────────────────────────────

export async function getLeaveAccrualPolicy(): Promise<LeaveAccrualPolicy> {
  if (env.useMockApi) {
    await delay()
    return { ...leaveAccrualPolicyMock }
  }
  try {
    const { data } = await apiClient.get<LeaveAccrualPolicy>('/admin/settings/leave-accrual')
    return data
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
  try {
    const { data } = await apiClient.patch<LeaveAccrualPolicy>(
      '/admin/settings/leave-accrual',
      patch,
    )
    return data
  } catch {
    return { ...leaveAccrualPolicyMock, ...patch }
  }
}
