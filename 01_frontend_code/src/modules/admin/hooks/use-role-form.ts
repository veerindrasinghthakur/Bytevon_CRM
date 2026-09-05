import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { queryKeys } from '@/shared/lib/query-keys'
import { myAdminRoutes } from '../routes'
import type { RoleFormMode, RolePermissionAction, RolePermissionMatrix } from '../types'
import { emptyMatrix, matrixToPermissions, seedMatrix } from '../lib/role-matrix'
import {
  createAdminRole,
  getAdminRole,
  listPermissionCatalog,
  updateAdminRole,
} from '../api/roles'
import { roleFormSchema, type RoleFormInput } from '../schemas/role-form'

export function useRoleForm(mode: RoleFormMode, roleId?: string, duplicateFromId?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: queryKeys.admin.rbac.permissionCatalog(),
    queryFn: listPermissionCatalog,
  })

  const modules = catalogQuery.data?.modules ?? []
  const actions = (catalogQuery.data?.actions ?? []) as RolePermissionAction[]

  const roleQuery = useQuery({
    queryKey: queryKeys.admin.roles.detail(roleId as string),
    queryFn: () => getAdminRole(roleId as string),
    enabled: mode === 'edit' && Boolean(roleId),
  })

  const sourceRoleQuery = useQuery({
    queryKey: queryKeys.admin.roles.detail(duplicateFromId as string),
    queryFn: () => getAdminRole(duplicateFromId as string),
    enabled: mode === 'create' && Boolean(duplicateFromId),
  })

  const role = roleQuery.data
  const sourceRole = sourceRoleQuery.data

  const form = useForm<RoleFormInput>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: undefined,
      status: undefined,
      hierarchy: undefined,
      inherit: 'None (Custom)',
      active: true,
    },
  })

  const { reset: resetForm } = form

  const [matrix, setMatrix] = useState<RolePermissionMatrix>({})
  const [seededFromDuplicate, setSeededFromDuplicate] = useState(false)
  const seededEditRoleIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (modules.length && actions.length) {
      setMatrix((prev) => {
        if (Object.keys(prev).length === modules.length) return prev
        return emptyMatrix(modules, actions)
      })
    }
  }, [modules, actions])

  useEffect(() => {
    if (mode !== 'edit' || !role || !modules.length || !actions.length) return
    const roleKey = String(role.id)
    if (seededEditRoleIdRef.current === roleKey) return
    seededEditRoleIdRef.current = roleKey
    resetForm({
      name: role.name,
      description: role.description ?? '',
      category: role.category,
      status: role.status,
      hierarchy: undefined,
      inherit: undefined,
      active: role.status === 'Active',
    })
    setMatrix(seedMatrix(role.permissions, modules, actions))
  }, [mode, role, modules, actions, resetForm])

  useEffect(() => {
    if (
      mode === 'create' &&
      sourceRole &&
      modules.length &&
      actions.length &&
      !seededFromDuplicate
    ) {
      resetForm({
        name: `${sourceRole.name} (Copy)`,
        description: sourceRole.description ?? '',
        category: sourceRole.category,
        status: sourceRole.status,
        hierarchy: undefined,
        inherit: undefined,
        active: sourceRole.status === 'Active',
      })
      setMatrix(seedMatrix(sourceRole.permissions, modules, actions))
      setSeededFromDuplicate(true)
    }
  }, [mode, sourceRole, modules, actions, seededFromDuplicate, resetForm])

  const toggleCell = useCallback((mod: string, action: RolePermissionAction) => {
    setMatrix((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod]?.[action] },
    }))
  }, [])

  const toggleRowAll = useCallback(
    (mod: string) => {
      setMatrix((prev) => {
        const row = prev[mod] ?? {}
        const allOn = actions.every((a) => row[a])
        return {
          ...prev,
          [mod]: Object.fromEntries(actions.map((a) => [a, !allOn])),
        }
      })
    },
    [actions],
  )

  const toggleColAll = useCallback(
    (action: RolePermissionAction) => {
      setMatrix((prev) => {
        const allOn = modules.every((m) => prev[m]?.[action])
        const next = { ...prev }
        modules.forEach((m) => {
          next[m] = { ...next[m], [action]: !allOn }
        })
        return next
      })
    },
    [modules],
  )

  const expandAll = useCallback(() => {
    const next = emptyMatrix(modules, actions)
    modules.forEach((m) => {
      next[m] = Object.fromEntries(actions.map((a) => [a, true]))
    })
    setMatrix(next)
  }, [modules, actions])

  const resetMatrix = useCallback(() => {
    setMatrix(emptyMatrix(modules, actions))
  }, [modules, actions])

  const saveMutation = useMutation({
    mutationFn: async (values: RoleFormInput) => {
      const permissions = matrixToPermissions(matrix)
      if (mode === 'create') {
        return createAdminRole({
          name: values.name,
          description: values.description ?? '',
          status: values.active ? 'Active' : 'Archived',
          permissions,
        })
      }
      return updateAdminRole(roleId as string, {
        name: values.name,
        description: values.description ?? '',
        status: values.active ? 'Active' : 'Archived',
        permissions,
      })
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.all })
      safeNavigate(navigate, {
        to: myAdminRoutes.rolesDetail(String(saved.id)),
        params: { roleId: String(saved.id) },
      })
    },
  })

  const cancel = useCallback(() => {
    if (mode === 'edit' && roleId) {
      safeNavigate(navigate, {
        to: myAdminRoutes.rolesDetail(roleId),
        params: { roleId },
      })
    } else {
      safeNavigate(navigate, { to: myAdminRoutes.rolesList })
    }
  }, [mode, roleId, navigate])

  const isLoadingSource =
    mode === 'create' && Boolean(duplicateFromId) && sourceRoleQuery.isLoading

  const values = form.watch()

  return {
    mode,
    role,
    sourceRole,
    isDuplicate: Boolean(duplicateFromId),
    isLoadingRole: (mode === 'edit' && roleQuery.isLoading) || isLoadingSource,
    isLoadingCatalog: catalogQuery.isLoading,
    form,
    /** Convenience mirrors for pages still using flat field API */
    name: values.name,
    setName: (v: string) => form.setValue('name', v, { shouldValidate: true }),
    description: values.description ?? '',
    setDescription: (v: string) => form.setValue('description', v),
    hierarchy: values.hierarchy ?? '',
    setHierarchy: (v: string) =>
      form.setValue('hierarchy', v as RoleFormInput['hierarchy'], { shouldValidate: true }),
    inherit: values.inherit ?? 'None (Custom)',
    setInherit: (v: string) =>
      form.setValue('inherit', v as RoleFormInput['inherit'], { shouldValidate: true }),
    active: values.active,
    setActive: (v: boolean) => form.setValue('active', v),
    matrix,
    toggleCell,
    toggleRowAll,
    toggleColAll,
    expandAll,
    resetMatrix,
    actions,
    modules,
    submit: form.handleSubmit((v) => saveMutation.mutate(v)),
    isSubmitting: saveMutation.isPending,
    cancel,
  }
}
