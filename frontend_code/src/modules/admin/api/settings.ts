/**
 * Admin settings API — organisation profile, attendance policy, leave accrual.
 * Mock/real switch; pages use TanStack Query only.
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
import { delay} from '@/shared/mock/db'


// ── Organisation profile ─────────────────────────────────────────────

export async function getOrganizationProfile(): Promise<OrganizationProfile> {
  if (env.useMockApi) {
    await delay()
    return { ...organizationProfileMock }
  }
  const { data } = await apiClient.get<OrganizationProfile>('/admin/settings/organization-profile')
  return data
}

export async function updateOrganizationProfile(
  patch: Partial<OrganizationProfile>,
): Promise<OrganizationProfile> {
  if (env.useMockApi) {
    await delay(400)
    Object.assign(organizationProfileMock, patch)
    return { ...organizationProfileMock }
  }
  const { data } = await apiClient.patch<OrganizationProfile>(
    '/admin/settings/organization-profile',
    patch,
  )
  return data
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
