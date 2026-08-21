import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ROLE_ACTIONS,
  ROLE_MODULES,
  type RolePermissionAction,
  type RolePermissionMatrix,
} from '../types'
import { createAdminRole, getAdminRole, updateAdminRole } from '../api/roles'

function emptyMatrix(): RolePermissionMatrix {
  const init: RolePermissionMatrix = {}
  ROLE_MODULES.forEach((m) => {
    init[m] = Object.fromEntries(ROLE_ACTIONS.map((a) => [a, false])) as Record<
      RolePermissionAction,
      boolean
    >
  })
  return init
}

function seedMatrix(permissions: string[]): RolePermissionMatrix {
  const init = emptyMatrix()
  ROLE_MODULES.forEach((m) => {
    const hasAny = permissions.some((p) => p.toLowerCase().includes(m.toLowerCase().slice(0, 4)))
    init[m] = Object.fromEntries(
      ROLE_ACTIONS.map((a) => [a, hasAny && (a === 'View' || a === 'Create' || a === 'Edit')]),
    ) as Record<RolePermissionAction, boolean>
  })
  if (permissions.some((p) => p.includes('manage') || p.includes('security'))) {
    ROLE_MODULES.forEach((m) => {
      init[m] = Object.fromEntries(ROLE_ACTIONS.map((a) => [a, true])) as Record<
        RolePermissionAction,
        boolean
      >
    })
  }
  return init
}

export type RoleFormMode = 'create' | 'edit'

export function useRoleForm(mode: RoleFormMode, roleId?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
  const [matrix, setMatrix] = useState<RolePermissionMatrix>(emptyMatrix)

  useEffect(() => {
    if (mode === 'edit' && role) {
      setName(role.name)
      setDescription(role.description)
      setActive(role.status === 'Active')
      setMatrix(seedMatrix(role.permissions))
    }
  }, [mode, role])

  const toggleCell = useCallback((mod: string, action: RolePermissionAction) => {
    setMatrix((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod][action] },
    }))
  }, [])

  const toggleRowAll = useCallback((mod: string) => {
    setMatrix((prev) => {
      const allOn = ROLE_ACTIONS.every((a) => prev[mod][a])
      return {
        ...prev,
        [mod]: Object.fromEntries(ROLE_ACTIONS.map((a) => [a, !allOn])) as Record<
          RolePermissionAction,
          boolean
        >,
      }
    })
  }, [])

  const toggleColAll = useCallback((action: RolePermissionAction) => {
    setMatrix((prev) => {
      const allOn = ROLE_MODULES.every((m) => prev[m][action])
      const next = { ...prev }
      ROLE_MODULES.forEach((m) => {
        next[m] = { ...next[m], [action]: !allOn }
      })
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setMatrix((prev) => {
      const next = { ...prev }
      ROLE_MODULES.forEach((m) => {
        next[m] = Object.fromEntries(ROLE_ACTIONS.map((a) => [a, true])) as Record<
          RolePermissionAction,
          boolean
        >
      })
      return next
    })
  }, [])

  const resetMatrix = useCallback(() => {
    setMatrix(emptyMatrix())
  }, [])

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
    actions: ROLE_ACTIONS,
    modules: ROLE_MODULES,
    submit: () => saveMutation.mutate(),
    isSubmitting: saveMutation.isPending,
    cancel,
  }
}
