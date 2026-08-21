import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RolePermissionAction, RolePermissionMatrix } from '../types'
import {
  createAdminRole,
  getAdminRole,
  listPermissionCatalog,
  updateAdminRole,
} from '../api/roles'

function emptyMatrix(modules: string[], actions: string[]): RolePermissionMatrix {
  const init: RolePermissionMatrix = {}
  modules.forEach((m) => {
    init[m] = Object.fromEntries(actions.map((a) => [a, false]))
  })
  return init
}

function seedMatrix(
  permissions: string[],
  modules: string[],
  actions: string[],
): RolePermissionMatrix {
  const init = emptyMatrix(modules, actions)
  modules.forEach((m) => {
    const key = m.toLowerCase()
    const hasAny = permissions.some((p) => p.toLowerCase().includes(key.slice(0, 4)))
    init[m] = Object.fromEntries(
      actions.map((a) => [a, hasAny && (a === 'VIEW' || a === 'CREATE' || a === 'UPDATE')]),
    )
  })
  if (permissions.some((p) => p.includes('manage') || p.includes('security'))) {
    modules.forEach((m) => {
      init[m] = Object.fromEntries(actions.map((a) => [a, true]))
    })
  }
  return init
}

export type RoleFormMode = 'create' | 'edit'

export function useRoleForm(mode: RoleFormMode, roleId?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: ['admin', 'rbac', 'permission-catalog'],
    queryFn: listPermissionCatalog,
  })

  const modules = catalogQuery.data?.modules ?? []
  const actions = (catalogQuery.data?.actions ?? []) as RolePermissionAction[]

  const roleQuery = useQuery({
    queryKey: ['admin', 'roles', roleId],
    queryFn: () => getAdminRole(roleId as string),
    enabled: mode === 'edit' && Boolean(roleId),
  })

  const role = roleQuery.data

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hierarchy, setHierarchy] = useState('Select Level')
  const [inherit, setInherit] = useState('None (Custom)')
  const [active, setActive] = useState(true)
  const [matrix, setMatrix] = useState<RolePermissionMatrix>({})

  useEffect(() => {
    if (modules.length && actions.length) {
      setMatrix((prev) => {
        if (Object.keys(prev).length === modules.length) return prev
        return emptyMatrix(modules, actions)
      })
    }
  }, [modules, actions])

  useEffect(() => {
    if (mode === 'edit' && role && modules.length && actions.length) {
      setName(role.name)
      setDescription(role.description)
      setActive(role.status === 'Active')
      setMatrix(seedMatrix(role.permissions, modules, actions))
    }
  }, [mode, role, modules, actions])

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
    mutationFn: async () => {
      if (mode === 'create') {
        return createAdminRole({
          name,
          description,
          status: active ? 'Active' : 'Archived',
        })
      }
      return updateAdminRole(roleId as string, {
        name,
        description,
        status: active ? 'Active' : 'Archived',
      })
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
      if (mode === 'create') {
        navigate({ to: '/admin/roles' })
      } else {
        navigate({ to: '/admin/roles/$roleId', params: { roleId: saved.id } })
      }
    },
  })

  const cancel = useCallback(() => {
    if (mode === 'edit' && roleId) {
      navigate({ to: '/admin/roles/$roleId', params: { roleId } })
    } else {
      navigate({ to: '/admin/roles' })
    }
  }, [mode, roleId, navigate])

  return {
    mode,
    role,
    isLoadingRole: mode === 'edit' && roleQuery.isLoading,
    isLoadingCatalog: catalogQuery.isLoading,
    name,
    setName,
    description,
    setDescription,
    hierarchy,
    setHierarchy,
    inherit,
    setInherit,
    active,
    setActive,
    matrix,
    toggleCell,
    toggleRowAll,
    toggleColAll,
    expandAll,
    resetMatrix,
    actions,
    modules,
    submit: () => saveMutation.mutate(),
    isSubmitting: saveMutation.isPending,
    cancel,
  }
}
