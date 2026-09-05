import { useEffect, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { queryKeys } from '@/shared/lib/query-keys'
import { myAdminRoutes } from '../routes'
import {
  createUserLogin,
  listEmploymentsWithoutLogin,
  listRoles,
} from '../api/users'
import { listDepartments } from '@/modules/workforce/api/departments'
import { userFormSchema, type UserFormInput } from '../schemas/user-form'

export function useUserCreate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useSearch({ strict: false }) as { employmentId?: string }
  const preselectId = search?.employmentId ? Number(search.employmentId) : null

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

  const form = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      employmentId: '',
      email: '',
      temporaryPassword: '',
      roleId: '',
      sendInvite: true,
    },
  })

  const { watch, setValue, reset: resetForm } = form

  useEffect(() => {
    const defaultRole = roles.find((r) => r.name === 'Employee') ?? roles[0]
    if (defaultRole && !watch('roleId')) {
      setValue('roleId', String(defaultRole.id), { shouldValidate: true })
    }
  }, [roles, watch, setValue])

  useEffect(() => {
    if (preselectId && candidates.some((e) => e.employmentId === preselectId)) {
      setValue('employmentId', String(preselectId), { shouldValidate: true })
      const emp = candidates.find((e) => e.employmentId === preselectId)
      if (emp) {
        const slug = emp.name.toLowerCase().replace(/\s+/g, '.')
        setValue('email', `${slug}@bytevon.com`, { shouldValidate: true })
      }
    }
  }, [preselectId, candidates, setValue])

  const filteredCandidates = useMemo(() => {
    const deptFilter = watch('deptFilter') ?? ''
    if (!deptFilter) return candidates
    return candidates.filter((c) => c.department === deptFilter)
  }, [candidates, watch])

  const employeeOptions = filteredCandidates.map((c) => ({
    value: String(c.employmentId),
    label: `${c.name} (${c.employeeCode})`,
    meta: `${c.department} · ${c.position}`,
  }))

  const selected = candidates.find((c) => String(c.employmentId) === watch('employmentId'))

  const createMutation = useMutation({
    mutationFn: (values: UserFormInput) =>
      createUserLogin({
        employmentId: Number(values.employmentId),
        email: values.email,
        temporaryPassword: values.temporaryPassword,
        roleId: values.roleId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      safeNavigate(navigate, { to: myAdminRoutes.usersList })
    },
    onError: (e) => {
      // Error handled by RHF formState.errors
      console.error(e)
    },
  })

  const onSelectEmployee = (v: string) => {
    setValue('employmentId', v, { shouldValidate: true })
    const emp = candidates.find((c) => String(c.employmentId) === v)
    if (emp) {
      const slug = emp.name.toLowerCase().replace(/\s+/g, '.')
      setValue('email', `${slug}@bytevon.com`, { shouldValidate: true })
    }
  }

  return {
    loading,
    form,
    candidates,
    roles,
    deptOptions,
    employeeOptions,
    selected,
    onSelectEmployee,
    submit: form.handleSubmit((values) => createMutation.mutate(values)),
    isSubmitting: createMutation.isPending,
    navigate,
  }
}
