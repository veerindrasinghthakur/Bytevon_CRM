import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
    queryKey: ['admin', 'users', 'without-login'],
    queryFn: listEmploymentsWithoutLogin,
  })
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', 'db'],
    queryFn: listRoles,
  })
  const deptsQuery = useQuery({
    queryKey: ['workforce', 'departments'],
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
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      navigate({ to: '/admin/users' })
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
    // Prefer original backend id when present (R-01); else numeric id
    const selectedRole = roles.find((r) => String(r.id) === roleId)
    const sourceId = (selectedRole as { _sourceId?: string | number } | undefined)?._sourceId
    createMutation.mutate({
      employmentId: Number(employmentId),
      email,
      temporaryPassword: tempPassword,
      roleId: sourceId ?? (Number.isNaN(Number(roleId)) ? roleId : Number(roleId)),
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
