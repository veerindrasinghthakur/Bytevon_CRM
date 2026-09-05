/**
 * Profile API — mock / real switch via env.useMockApi.
 * Sessions are stored in mock DB (mockSessions); real mode hits backend.
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
  ProfileSession,
  ProfileUpdateInput,
} from '../types'
import { delay} from '@/shared/mock/db'


export async function getMyProfile(): Promise<ProfileDetail> {
  if (env.useMockApi) {
    await delay()
    return structuredClone(getProfileStore())
  }
  const { data } = await apiClient.get<ProfileDetail>('/profile/me')
  return data
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
    return structuredClone(next)
  }
  const { data } = await apiClient.patch<ProfileDetail>('/profile/me', input)
  return data
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
  const { data } = await apiClient.get<ProfileSession[]>('/profile/sessions')
  return data
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
  await apiClient.post(`/profile/sessions/${sessionId}/revoke`)
}

export async function revokeAllOtherSessions(): Promise<void> {
  if (env.useMockApi) {
    await delay(250)
    replaceMockSessions(
      mockSessions.map((s) => (s.current ? s : { ...s, status: SessionStatus.REVOKED })),
    )
    return
  }
  await apiClient.post('/profile/sessions/revoke-all')
}

export async function listMyActivity(): Promise<ProfileActivityItem[]> {
  if (env.useMockApi) {
    await delay()
    return structuredClone(mockActivity)
  }
  const { data } = await apiClient.get<ProfileActivityItem[]>('/profile/activity')
  return data
}

export async function changeMyPassword(input: ChangePasswordInput): Promise<{ message: string }> {
  return changePasswordApi(input)
}
