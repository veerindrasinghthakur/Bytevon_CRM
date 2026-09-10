/**
 * Admin settings API — organisation profile, attendance policy, leave accrual.
 * Mock/real switch; pages use TanStack Query only.
 *
 * Backend GET/PATCH /organization/settings returns:
 *   { id, company_name, head_office_location_id, default_timezone,
 *     default_currency, logo_reference, created_at, updated_at, changed_by }
 *
 * UI profile section uses a flatter OrganizationProfile shape — map at the boundary.
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
  // Optional extended profile fields (may be absent on current schema)
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

/** Map UI profile → backend OrganizationSettingsUpdate. */
function mapProfileToApi(patch: Partial<OrganizationProfile>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (patch.name != null) body.company_name = patch.name
  if (patch.defaultTimezone != null) body.default_timezone = patch.defaultTimezone
  if (patch.defaultCurrency != null) body.default_currency = patch.defaultCurrency
  if (patch.headOfficeLocationId !== undefined) {
    body.head_office_location_id = patch.headOfficeLocationId
  }
  if (patch.logoReference !== undefined) body.logo_reference = patch.logoReference
  // Extended fields are ignored by current backend schema (safe no-ops if sent)
  return body
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

export async function getAttendanceSettings(): Promise<AttendanceSettings> {
  if (env.useMockApi) {
    await delay()
    return { ...attendanceSettingsMock }
  }
  const { data } = await apiClient.get<AttendanceSettings>('/admin/settings/attendance')
  return data
}

export async function updateAttendanceSettings(
  patch: Partial<AttendanceSettings>,
): Promise<AttendanceSettings> {
  if (env.useMockApi) {
    await delay(400)
    Object.assign(attendanceSettingsMock, patch)
    return { ...attendanceSettingsMock }
  }
  const { data } = await apiClient.patch<AttendanceSettings>('/admin/settings/attendance', patch)
  return data
}

// ── Leave accrual policy (company-wide) ──────────────────────────────

export async function getLeaveAccrualPolicy(): Promise<LeaveAccrualPolicy> {
  if (env.useMockApi) {
    await delay()
    return { ...leaveAccrualPolicyMock }
  }
  const { data } = await apiClient.get<LeaveAccrualPolicy>('/admin/settings/leave-accrual')
  return data
}

export async function updateLeaveAccrualPolicy(
  patch: Partial<LeaveAccrualPolicy>,
): Promise<LeaveAccrualPolicy> {
  if (env.useMockApi) {
    await delay(400)
    Object.assign(leaveAccrualPolicyMock, patch)
    return { ...leaveAccrualPolicyMock }
  }
  const { data } = await apiClient.patch<LeaveAccrualPolicy>(
    '/admin/settings/leave-accrual',
    patch,
  )
  return data
}
