/**
 * Profile API — owned by my-work (self-service).
 * Mock / real switch via env.useMockApi.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { SessionStatus } from '@/shared/schema'
import type { ChangePasswordInput } from '@/modules/auth/schemas/auth'
import { changePasswordApi, loadStoredSession } from '@/modules/auth/api/auth'
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

/** Backend /profile/me keys → UI ProfileDetail (snake + camel accepted). */
function normalizeProfile(raw: Partial<ProfileDetail> & Record<string, unknown>): ProfileDetail {
  const prefs = (raw.preferences ?? {}) as Partial<ProfilePreferences> & {
    location?: unknown
    timezone?: unknown
  }
  const position = String(raw.position ?? raw.title ?? raw.jobTitle ?? raw.job_title ?? '')
  const manager = String(raw.managerName ?? raw.reportingManager ?? raw.reporting_manager ?? '')
  const joining = String(raw.joiningDate ?? raw.joining_date ?? '')
  const workMode = String(raw.workMode ?? raw.workMode ?? raw.work_type ?? '')
  return {
    id: Number(raw.id ?? raw.loginId ?? raw.login_id ?? 0),
    username: String(raw.username ?? raw.name ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    location: String(raw.location ?? prefs.location ?? ''),
    dateOfBirth: String(raw.dateOfBirth ?? raw.date_of_birth ?? ''),
    timezone: String(raw.timezone ?? prefs.timezone ?? ''),
    role: String(raw.role ?? position),
    department: String(raw.department ?? ''),
    jobTitle: String(raw.jobTitle ?? raw.job_title ?? position),
    reportingManager: manager,
    joiningDate: joining,
    workType: workMode,
    employmentId: Number(raw.employmentId ?? raw.employment_id ?? 0),
    personId: Number(raw.personId ?? raw.person_id ?? 0),
    employeeCode: String(raw.employeeCode ?? raw.employee_code ?? ''),
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
  const [me, prefs] = await Promise.all([
    apiClient.get<Partial<ProfileDetail>>('/profile/me').then((r) => r.data),
    apiClient.get<Partial<ProfilePreferences>>('/profile/preferences').then((r) => r.data).catch(() => ({})),
  ])
  const merged = { ...(me as Record<string, unknown>), preferences: prefs }
  // Backend appearance key is `theme`; UI uses `appearance`.
  const prefRec = merged.preferences as Record<string, unknown>
  if (prefRec && prefRec.appearance == null && prefRec.theme != null) {
    prefRec.appearance = prefRec.theme
  }
  return normalizeProfile(merged as ProfileDetail)
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

export async function updateMyPreferences(
  input: Partial<ProfilePreferences> & {
    theme?: string
    location?: string | null
    timezone?: string | null
  },
): Promise<ProfilePreferences> {
  if (env.useMockApi) {
    await delay(200)
    const cur = getProfileStore()
    const next = { ...cur.preferences, ...input }
    setProfileStore({ ...cur, preferences: next })
    return next
  }
  const body: Record<string, unknown> = { ...input }
  // UI `appearance` ↔ backend `theme`.
  if (body.appearance != null && body.theme == null) body.theme = body.appearance
  delete body.appearance
  const { data } = await apiClient.patch<Record<string, unknown>>('/profile/preferences', body)
  const rec = (data ?? {}) as Record<string, unknown>
  return {
    emailNotifications: Boolean(rec.emailNotifications ?? true),
    desktopPush: Boolean(rec.desktopPush ?? true),
    language: String(rec.language ?? 'en'),
    appearance: (rec.theme ?? rec.appearance ?? 'system') as ProfilePreferences['appearance'],
  }
}

export async function listMySessions(): Promise<ProfileSession[]> {
  if (env.useMockApi) {
    await delay()
    return structuredClone(mockSessions)
  }
  const sessionId = loadStoredSession()?.user.sessionId ?? null
  // baseURL already includes /api/v1 — do not prefix again
  const { data } = await apiClient.get<Array<Record<string, unknown>>>('/auth/sessions', {
    params: sessionId != null ? { current_session_id: sessionId } : undefined,
  })
  const rows = Array.isArray(data) ? data : []
  return rows.map((r) => ({
    id: Number(r.id),
    device_name: String(r.device_name ?? r.deviceName ?? 'Unknown device'),
    device_type: String(r.device_type ?? r.deviceType ?? 'OTHER'),
    ip_address: String(r.ip_address ?? r.ip ?? ''),
    status: String(r.status ?? 'ACTIVE'),
    last_used_at: String(r.last_used_at ?? r.lastUsedAt ?? r.created_at ?? ''),
    current: Boolean(r.current ?? (sessionId != null && Number(r.id) === sessionId)),
  }))
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
  const sessionId = loadStoredSession()?.user.sessionId ?? null
  await apiClient.post('/auth/sessions/revoke-others', null, {
    params: sessionId != null ? { keep_session_id: sessionId } : undefined,
  })
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
