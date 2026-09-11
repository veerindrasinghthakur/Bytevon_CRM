import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'
import { myAdminRoutes } from '../routes'
import { uploadAvatar } from '@/modules/my-work/api/profile'
import {
  activateUser,
  archiveUserCredentials,
  deactivateUser,
  getUserLogin,
  listDepartments,
  listRoles,
  lockUser,
  unlockUser,
  updateUserLogin,
} from '../api/users'
import { userEditFormSchema, type UserEditFormValues } from '../schemas/user-form'
import type { AdminUserStatus } from '../types'

async function uploadUserAvatar(_userId: string, file: File) {
  return uploadAvatar(file)
}

export function useUserDetail(userId?: string) {
  const loginId = userId ? Number(userId) : NaN
  const navigate = useNavigate()
  const qc = useQueryClient()

  const detailQuery = useQuery({
    queryKey: queryKeys.admin.users.detail(loginId),
    queryFn: () => getUserLogin(loginId),
    enabled: Number.isFinite(loginId),
  })

  const rolesQuery = useQuery({
    queryKey: queryKeys.admin.roles.list(),
    queryFn: listRoles,
  })

  const deptsQuery = useQuery({
    queryKey: queryKeys.workforce.departments.list(),
    queryFn: listDepartments,
  })

  const display = detailQuery.data?.display
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)

  const [status, setStatus] = useState<AdminUserStatus>('Active')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [resetOpen, setResetOpen] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: { name: '', email: '', departmentId: '', roleId: '' },
  })
  const { reset, setError, clearErrors } = form

  const roleOptions =
    Array.isArray(rolesQuery.data)
      ? rolesQuery.data.map((r) => ({
          value: String(r.id),
          label: r.name,
          meta: r.description ?? undefined,
        }))
      : []

  const deptOptions =
    Array.isArray(deptsQuery.data)
      ? deptsQuery.data.map((d) => ({
          value: String(d.id),
          label: d.name,
        }))
      : []

  useEffect(() => {
    if (!display || isEditing) return
    setStatus(display.status)
    const matchRole = rolesQuery.data?.find((r) => r.name === display.role)
    const deptMatch = deptsQuery.data?.find((d) => d.name === display.department)
    const resolvedDeptId =
      (display as { departmentId?: number | null }).departmentId != null
        ? String((display as { departmentId?: number | null }).departmentId)
        : deptMatch?.id != null
          ? String(deptMatch.id)
          : ''
    reset({
      name: display.name,
      email: display.email,
      departmentId: resolvedDeptId,
      roleId: matchRole ? String(matchRole.id) : '',
    })
  }, [display, isEditing, rolesQuery.data, deptsQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (values: UserEditFormValues) =>
      updateUserLogin(loginId, {
        email: values.email,
        name: values.name,
        department:
          deptOptions.find((o) => o.value === values.departmentId)?.label ?? display?.department ?? '',
        departmentId: values.departmentId ? Number(values.departmentId) : undefined,
        role: roleOptions.find((o) => o.value === values.roleId)?.label ?? display?.role ?? '',
      }),
    onSuccess: () => {
      setActionError(null)
      clearErrors('root')
      void qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      finishEditing()
    },
    onError: (e: unknown) => {
      const msg = getApiErrorMessage(e, 'Could not save user')
      setActionError(msg)
      setError('root', { type: 'server', message: msg })
    },
  })

  const lockMutation = useMutation({
    mutationFn: async () => {
      if (status === 'Locked') return unlockUser(loginId)
      return lockUser(loginId)
    },
    onSuccess: () => {
      setActionError(null)
      void qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      setStatus((s) => (s === 'Locked' ? 'Active' : 'Locked'))
      setLockOpen(false)
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not update lock status'))
      setLockOpen(false)
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateUser(loginId),
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      setStatus('Inactive')
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not deactivate user'))
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => activateUser(loginId),
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      setStatus('Active')
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not activate user'))
    },
  })

  const hardArchiveMutation = useMutation({
    mutationFn: () => archiveUserCredentials(loginId),
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users.withoutLogin() })
      safeNavigate(navigate, { to: myAdminRoutes.usersList })
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not archive credentials'))
    },
  })

  const resetMutation = useMutation({
    mutationFn: () =>
      updateUserLogin(loginId, {
        temporaryPassword: tempPassword || `Temp@${Date.now().toString().slice(-6)}`,
      }),
    onSuccess: () => {
      setActionError(null)
      setResetSent(true)
      setTimeout(() => {
        setResetOpen(false)
        setResetSent(false)
        setTempPassword('')
      }, 1500)
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not reset password'))
      setResetOpen(false)
    },
  })

  const handleCancelEdit = () => {
    cancelEditing()
    setActionError(null)
    clearErrors('root')
    if (display) {
      const matchRole = rolesQuery.data?.find((r) => r.name === display.role)
      const deptMatch = deptsQuery.data?.find((d) => d.name === display.department)
      const resolvedDeptId =
        (display as { departmentId?: number | null }).departmentId != null
          ? String((display as { departmentId?: number | null }).departmentId)
          : deptMatch?.id != null
            ? String(deptMatch.id)
            : ''
      reset({
        name: display.name,
        email: display.email,
        departmentId: resolvedDeptId,
        roleId: matchRole ? String(matchRole.id) : '',
      })
    }
  }

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    try {
      const res = await uploadUserAvatar(userId, file)
      setAvatarUrl(res.avatarUrl)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not upload avatar'))
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  return {
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    loadError: detailQuery.isError
      ? getApiErrorMessage(detailQuery.error, 'Could not load user')
      : null,
    refetch: () => void detailQuery.refetch(),
    display,
    form,
    status,
    avatarUrl,
    avatarUploading,
    fileRef,
    roleOptions,
    deptOptions,
    resetOpen,
    setResetOpen,
    lockOpen,
    setLockOpen,
    resetSent,
    tempPassword,
    setTempPassword,
    isEditing,
    startEditing,
    handleCancelEdit,
    saveMutation,
    lockMutation,
    deactivateMutation,
    activateMutation,
    hardArchiveMutation,
    resetMutation,
    onAvatarPick,
    actionError,
    serverError: (form.formState.errors.root?.message as string | undefined) ?? actionError,
  }
}
