import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChangePasswordInput } from '@/modules/auth/schemas/auth'
import {
  changeMyPassword,
  getMyProfile,
  listMyActivity,
  listMySessions,
  revokeAllOtherSessions,
  revokeSession,
  updateMyProfile,
  uploadAvatar,
} from '../api/profile'
import type { ProfileUpdateInput } from '../types'

export const profileKeys = {
  me: ['profile', 'me'] as const,
  sessions: ['profile', 'sessions'] as const,
  activity: ['profile', 'activity'] as const,
} as const

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getMyProfile,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateMyProfile(input),
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.me, data)
    },
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}

export function useMySessions() {
  return useQuery({
    queryKey: profileKeys.sessions,
    queryFn: listMySessions,
  })
}

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => revokeSession(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.sessions })
    },
  })
}

export function useRevokeAllOtherSessions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => revokeAllOtherSessions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.sessions })
    },
  })
}

export function useMyActivity() {
  return useQuery({
    queryKey: profileKeys.activity,
    queryFn: listMyActivity,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changeMyPassword(input),
  })
}
