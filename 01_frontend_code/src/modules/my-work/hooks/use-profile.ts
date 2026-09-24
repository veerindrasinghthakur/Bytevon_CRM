import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChangePasswordInput } from '@/modules/auth/schemas/auth'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  changeMyPassword,
  getMyProfile,
  listMyActivity,
  listMySessions,
  revokeAllOtherSessions,
  revokeSession,
  updateMyPreferences,
  updateMyProfile,
  uploadAvatar,
} from '../api/profile'
import type { ProfilePreferences, ProfileUpdateInput } from '../types'

export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: getMyProfile,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateMyProfile(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile.me() })
    },
  })
}

export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Partial<ProfilePreferences> & {
        theme?: string
        location?: string | null
        timezone?: string | null
      },
    ) => updateMyPreferences(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile.me() })
    },
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile.me() })
    },
  })
}

export function useMySessions() {
  return useQuery({
    queryKey: queryKeys.profile.sessions(),
    queryFn: listMySessions,
  })
}

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => revokeSession(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile.sessions() })
    },
  })
}

export function useRevokeAllOtherSessions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => revokeAllOtherSessions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.profile.sessions() })
    },
  })
}

export function useMyActivity() {
  return useQuery({
    queryKey: queryKeys.profile.activity(),
    queryFn: listMyActivity,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changeMyPassword(input),
  })
}
