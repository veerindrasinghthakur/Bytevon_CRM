import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { queryKeys } from '@/shared/lib/query-keys'
import { myAdminRoutes } from '../routes'
import {
  createUserLogin,
  listEmploymentsWithoutLogin,
  listRoles,
} from '../api/users'
import { listDepartments } from '@/modules/workforce/api/departments'

export function useUserCreate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useSearch({ strict: false }) as { employmentId?: string }
  const preselectId = search?.employmentId ? Number(search.employmentId) : null

  const [deptFilter, setDeptFilter] = useState('')
  const [employmentId, setEmploymentId] = useState('')
  const [email, setEmail] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [sendInvite, setSendInvite] = useState(true)
  const [error, setError] = useState('')

  const candidatesQuery = useQuery({
    queryKey: queryKeys.admin.users.withoutLogin(),
    queryFn: listEmploymentsWithoutLogin,
  })
  const rolesQuery = useQuery({
    queryKey: queryKeys.admin.roles.list(),
    queryFn: listRoles,
  })
  const deptsQuery = useQuery({
    queryKey: queryKeys.workforce.departments.list(),
    queryFn: () => listDepartments(),
  })

  const candidates = candidatesQuery.data ?? []
  const roles = rolesQuery.data ?? []
  const loading = candidatesQuery.isLoading || rolesQuery.isLoading || deptsQuery.isLoading

  const deptOptions = useMemo(
    () => [
      { value: '', label: 'All departments' },
      ...(deptsQuery.data?.items ?? []).map((d) => ({ value: d.name, label: d.name })),
    ],
    [deptsQuery.data],
  )

  useEffect(() => {
    const defaultRole = roles.find((r) => r.name === 'Employee') ?? roles[0]
    if (defaultRole && !roleId) setRoleId(String(defaultRole.id))
  }, [roles, roleId])

  useEffect(() => {
    if (preselectId && candidates.some((e) => e.employmentId === preselectId)) {
      setEmploymentId(String(preselectId))
      const emp = candidates.find((e) => e.employmentId === preselectId)
      if (emp) {
        const slug = emp.name.toLowerCase().replace(/\s+/g, '.')
        setEmail(`${slug}@bytevon.com`)
      }
    }
  }, [preselectId, candidates])

  const filteredCandidates = useMemo(() => {
    if (!deptFilter) return candidates
    return candidates.filter((c) => c.department === deptFilter)
  }, [candidates, deptFilter])

  const employeeOptions = filteredCandidates.map((c) => ({
    value: String(c.employmentId),
    label: `${c.name} (${c.employeeCode})`,
    meta: `${c.department} · ${c.position}`,
  }))

  const selected = candidates.find((c) => String(c.employmentId) === employmentId)

  const createMutation = useMutation({
    mutationFn: createUserLogin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      safeNavigate(navigate, { to: myAdminRoutes.usersList })
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : 'Failed to create user')
    },
  })

  const handleCreate = () => {
    setError('')
    if (!employmentId) {
      setError('Select an employee who does not yet have a login.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid work email.')
      return
    }
    if (!tempPassword || tempPassword.length < 8) {
      setError('Temporary password must be at least 8 characters.')
      return
    }
    if (!roleId) {
      setError('Select a role.')
      return
    }
    createMutation.mutate({
      employmentId: Number(employmentId),
      email,
      temporaryPassword: tempPassword,
      roleId,
    })
  }

  const onSelectEmployee = (v: string) => {
    setEmploymentId(v)
    const emp = candidates.find((c) => String(c.employmentId) === v)
    if (emp) {
      const slug = emp.name.toLowerCase().replace(/\s+/g, '.')
      setEmail(`${slug}@bytevon.com`)
    }
  }

  return {
    loading,
    error,
    candidates,
    roles,
    deptFilter,
    setDeptFilter,
    deptOptions,
    employmentId,
    onSelectEmployee,
    employeeOptions,
    selected,
    email,
    setEmail,
    tempPassword,
    setTempPassword,
    roleId,
    setRoleId,
    sendInvite,
    setSendInvite,
    handleCreate,
    saving: createMutation.isPending,
    navigate,
  }
}
