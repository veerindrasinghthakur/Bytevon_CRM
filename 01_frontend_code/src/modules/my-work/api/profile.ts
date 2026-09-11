/**
 * Profile API — owned by my-work (self-service).
 * Mock / real switch via env.useMockApi.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { SessionStatus } from '@/shared/schema'
import type { ChangePasswordInput } from '@/modules/auth/schemas/auth'
import { changePasswordApi } from '@/modules/auth/api/auth'
import {
  getProfileStore,
  setProfileStore,
  mockActivity,
  mockSessions,
  replaceMockSessions,
} from '@/shared/mock/data/profile'
import type {
  ProfileActivityItem,
  ProfileDetail,
  ProfilePreferences,
  ProfileSession,
  ProfileUpdateInput,
} from '../types'
import { delay } from '@/shared/mock/db'

const DEFAULT_PREFERENCES: ProfilePreferences = {
  emailNotifications: true,
  desktopPush: true,
  language: 'en',
  appearance: 'system',
}

/** Backend may omit preferences — always return a full object for the UI. */
function normalizeProfile(raw: Partial<ProfileDetail> & Record<string, unknown>): ProfileDetail {
  const prefs = (raw.preferences ?? {}) as Partial<ProfilePreferences>
  return {
    id: Number(raw.id ?? 0),
    username: String(raw.username ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    location: String(raw.location ?? ''),
    dateOfBirth: String(raw.dateOfBirth ?? raw.date_of_birth ?? ''),
    timezone: String(raw.timezone ?? ''),
    role: String(raw.role ?? ''),
    department: String(raw.department ?? ''),
    jobTitle: String(raw.jobTitle ?? raw.job_title ?? ''),
    reportingManager: String(raw.reportingManager ?? raw.reporting_manager ?? ''),
    joiningDate: String(raw.joiningDate ?? raw.joining_date ?? ''),
    workType: String(raw.workType ?? raw.work_type ?? ''),
    employmentId: Number(raw.employmentId ?? raw.employment_id ?? 0),
    personId: Number(raw.personId ?? raw.person_id ?? 0),
    avatarUrl: (raw.avatarUrl ?? raw.avatar_url ?? null) as string | null,
    orgMail: String(raw.orgMail ?? raw.org_mail ?? raw.email ?? ''),
    lastLoginAt: String(raw.lastLoginAt ?? raw.last_login_at ?? ''),
    lastLoginIp: String(raw.lastLoginIp ?? raw.last_login_ip ?? ''),
    preferences: {
      emailNotifications: prefs.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
      desktopPush: prefs.desktopPush ?? DEFAULT_PREFERENCES.desktopPush,
      language: prefs.language ?? DEFAULT_PREFERENCES.language,
      appearance: prefs.appearance ?? DEFAULT_PREFERENCES.appearance,
    },
  }
}

export async function getMyProfile(): Promise<ProfileDetail> {
  if (env.useMockApi) {
    await delay()
    return normalizeProfile(structuredClone(getProfileStore()) as ProfileDetail)
  }
  const { data } = await apiClient.get<Partial<ProfileDetail>>('/profile/me')
  return normalizeProfile(data as ProfileDetail)
}

export async function updateMyProfile(input: ProfileUpdateInput): Promise<ProfileDetail> {
  if (env.useMockApi) {
    await delay()
    const cur = getProfileStore()
    const next: ProfileDetail = {
      ...cur,
      ...input,
      preferences: input.preferences
        ? { ...cur.preferences, ...input.preferences }
        : cur.preferences,
    }
    setProfileStore(next)
    return normalizeProfile(structuredClone(next))
  }
  const { data } = await apiClient.patch<Partial<ProfileDetail>>('/profile/me', input)
  return normalizeProfile(data as ProfileDetail)
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  if (env.useMockApi) {
    await delay(400)
    const url = URL.createObjectURL(file)
    const cur = getProfileStore()
    setProfileStore({ ...cur, avatarUrl: url })
    return { avatarUrl: url }
  }
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<{ avatarUrl: string }>('/profile/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listMySessions(): Promise<ProfileSession[]> {
  if (env.useMockApi) {
    await delay()
    return structuredClone(mockSessions)
  }
  // baseURL already includes /api/v1 — do not prefix again
  const { data } = await apiClient.get<ProfileSession[] | { items?: ProfileSession[] }>('/auth/sessions')
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

export async function revokeSession(sessionId: number): Promise<void> {
  if (env.useMockApi) {
    await delay(200)
    replaceMockSessions(
      mockSessions.map((s) =>
        s.id === sessionId ? { ...s, status: SessionStatus.REVOKED } : s,
      ),
    )
    return
  }
  await apiClient.post(`/auth/sessions/${sessionId}/revoke`)
}

export async function revokeAllOtherSessions(): Promise<void> {
  if (env.useMockApi) {
    await delay(250)
    replaceMockSessions(
      mockSessions.map((s) => (s.current ? s : { ...s, status: SessionStatus.REVOKED })),
    )
    return
  }
  await apiClient.post('/auth/sessions/revoke-all')
}

export async function listMyActivity(): Promise<ProfileActivityItem[]> {
  if (env.useMockApi) {
    await delay()
    return structuredClone(mockActivity)
  }
  const { data } = await apiClient.get<
    ProfileActivityItem[] | { items?: ProfileActivityItem[] }
  >('/profile/activity')
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

export async function changeMyPassword(input: ChangePasswordInput): Promise<{ message: string }> {
  return changePasswordApi(input)
}
