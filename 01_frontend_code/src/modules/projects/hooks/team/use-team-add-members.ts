import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { addTeamMember } from '../../api/team'
import { listEmployments } from '@/modules/workforce/api/employment'
import { useTeamDetail } from './use-team-detail'
import { toast } from '@/shared/hooks/use-toast'
import { getApiErrorMessage } from '@/shared/lib/api-error'

export const TEAM_MEMBER_ROLE_OPTIONS = ['Member', 'Lead', 'Senior', 'Junior'] as const

export type AddMemberSelection = {
  employmentId: number
  name: string
  code: string
  role: string
  customRole: string
  useCustom: boolean
}

function effectiveRole(s: AddMemberSelection): string {
  if (s.useCustom) return s.customRole.trim()
  return s.role
}

export function useTeamAddMembers(teamIdParam: string | undefined) {
  const numericId = teamIdParam != null ? Number(teamIdParam) : NaN
  const enabled = Number.isFinite(numericId)
  const { team, members, isLoading: isTeamLoading } = useTeamDetail(teamIdParam)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<number, AddMemberSelection>>({})
  const [submitting, setSubmitting] = useState(false)

  const employeesQuery = useQuery({
    queryKey: ['workforce', 'employments', 'team-add-members'],
    queryFn: () => listEmployments({ page: 1, pageSize: 300 }),
    staleTime: 60_000,
    enabled,
  })

  const existingIds = useMemo(
    () => new Set((members ?? []).map((m) => Number(m.employmentId)).filter((n) => n > 0)),
    [members],
  )

  const candidates = useMemo(() => {
    const items = employeesQuery.data?.items ?? []
    const q = query.trim().toLowerCase()
    return items
      .filter((e) => !existingIds.has(Number(e.id)))
      .filter(
        (e) =>
          !q ||
          (e.fullName ?? '').toLowerCase().includes(q) ||
          (e.employee_code ?? '').toLowerCase().includes(q) ||
          (e.departmentName ?? '').toLowerCase().includes(q),
      )
  }, [employeesQuery.data, existingIds, query])

  const toggle = (employmentId: number, name: string, code: string) => {
    setSelected((prev) => {
      if (prev[employmentId]) {
        const next = { ...prev }
        delete next[employmentId]
        return next
      }
      return {
        ...prev,
        [employmentId]: {
          employmentId,
          name,
          code,
          role: 'Member',
          customRole: '',
          useCustom: false,
        },
      }
    })
  }

  const setRole = (employmentId: number, role: string) => {
    setSelected((prev) =>
      prev[employmentId] ? { ...prev, [employmentId]: { ...prev[employmentId], role } } : prev,
    )
  }

  const setUseCustom = (employmentId: number, useCustom: boolean) => {
    setSelected((prev) =>
      prev[employmentId] ? { ...prev, [employmentId]: { ...prev[employmentId], useCustom } } : prev,
    )
  }

  const setCustomRole = (employmentId: number, customRole: string) => {
    setSelected((prev) =>
      prev[employmentId] ? { ...prev, [employmentId]: { ...prev[employmentId], customRole } } : prev,
    )
  }

  const selectionList = useMemo(() => Object.values(selected), [selected])
  const canSubmit =
    selectionList.length > 0 && selectionList.every((s) => effectiveRole(s).length > 0)

  const submit = async (): Promise<boolean> => {
    if (!canSubmit || submitting) return false
    setSubmitting(true)
    try {
      for (const s of selectionList) {
        await addTeamMember(numericId, {
          employmentId: s.employmentId,
          teamRole: effectiveRole(s),
        })
      }
      toast.success(
        selectionList.length === 1 ? 'Member added to team' : `${selectionList.length} members added`,
      )
      return true
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add members'))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    team,
    teamId: enabled ? numericId : null,
    isLoading: isTeamLoading || employeesQuery.isLoading,
    isError: employeesQuery.isError,
    loadError: employeesQuery.error,
    refetch: () => void employeesQuery.refetch(),
    query,
    setQuery,
    candidates,
    selected,
    selectionList,
    toggle,
    setRole,
    setUseCustom,
    setCustomRole,
    canSubmit,
    submitting,
    submit,
  }
}
