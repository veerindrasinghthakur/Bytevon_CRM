import { useEffect, useMemo, useState } from 'react'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { useTeam, useUpdateTeam } from './use-teams'
import { useProjects } from './use-projects'
import { listEmployments } from '@/modules/workforce/api/employment'
import type { TeamStatus } from '../types'

export interface TeamMemberRow {
  employmentId: number
  name: string
  code: string
  role: string
  isHead?: boolean
}

export interface TeamDetailDraft {
  name: string
  description: string
  department: string
  headName: string
  headRole: string
  status: TeamStatus
}

const empty: TeamDetailDraft = {
  name: '',
  description: '',
  department: '',
  headName: '',
  headRole: '',
  status: 'ACTIVE',
}

export function useTeamDetail(teamId: number | undefined) {
  const query = useTeam(teamId)
  const { data: projectsData } = useProjects({})
  const updateMutation = useUpdateTeam()
  const team = query.data ?? null
  const { isEditing, startEditing: setEditingTrue, cancelEditing, finishEditing } = useEditMode()
  const [draft, setDraft] = useState<TeamDetailDraft>(empty)
  const [members, setMembers] = useState<TeamMemberRow[]>([])
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [empOptions, setEmpOptions] = useState<{ value: string; label: string; meta?: string }[]>([])
  const [picked, setPicked] = useState('')

  const recentProjects = useMemo(() => (projectsData?.items ?? []).slice(0, 5), [projectsData])

  useEffect(() => {
    if (!team) return
    setDraft({
      name: team.name,
      description: team.description ?? '',
      department: team.department ?? '',
      headName: team.headName ?? '',
      headRole: team.headRole ?? '',
      status: team.status,
    })
    void listEmployments({}).then((res) => {
      const opts = res.items.map((e) => ({
        value: String(e.id),
        label: `${e.fullName} (${e.employee_code})`,
        meta: e.departmentName,
      }))
      setEmpOptions(opts)
      const seed: TeamMemberRow[] = []
      if (team.headName) {
        const head = res.items.find((e) => e.fullName === team.headName)
        seed.push({
          employmentId: head?.id ?? 0,
          name: team.headName,
          code: head?.employee_code ?? '—',
          role: team.headRole ?? 'Team Lead',
          isHead: true,
        })
      }
      const others = res.items
        .filter((e) => e.fullName !== team.headName)
        .slice(0, Math.max(0, Math.min(team.memberCount - seed.length, 5)))
        .map((e) => ({
          employmentId: e.id,
          name: e.fullName,
          code: e.employee_code,
          role: e.positionName,
        }))
      setMembers([...seed, ...others])
    })
  }, [team?.id])

  const memberIds = useMemo(() => new Set(members.map((m) => String(m.employmentId))), [members])
  const availableOpts = empOptions.filter((o) => !memberIds.has(o.value))

  const startEditing = () => {
    if (!team) return
    setDraft({
      name: team.name,
      description: team.description ?? '',
      department: team.department ?? '',
      headName: team.headName ?? '',
      headRole: team.headRole ?? '',
      status: team.status,
    })
    setEditingTrue()
  }

  const cancelEdit = () => {
    if (team) {
      setDraft({
        name: team.name,
        description: team.description ?? '',
        department: team.department ?? '',
        headName: team.headName ?? '',
        headRole: team.headRole ?? '',
        status: team.status,
      })
    }
    cancelEditing()
  }

  const save = async () => {
    if (!team) return
    await updateMutation.mutateAsync({
      id: team.id,
      patch: {
        name: draft.name,
        description: draft.description,
        department: draft.department,
        headName: draft.headName || undefined,
        headRole: draft.headRole || undefined,
        status: draft.status,
      },
    })
    finishEditing()
    void query.refetch()
  }

  const addMember = () => {
    if (!picked) return
    const opt = empOptions.find((o) => o.value === picked)
    if (!opt) return
    setMembers((prev) => [
      ...prev,
      {
        employmentId: Number(picked),
        name: opt.label.replace(/ \(.*\)$/, ''),
        code: opt.label.match(/\(([^)]+)\)/)?.[1] ?? '—',
        role: opt.meta ?? 'Member',
      },
    ])
    setPicked('')
    setAddMemberOpen(false)
  }

  const removeMember = (employmentId: number) => {
    setMembers((prev) => prev.filter((x) => x.employmentId !== employmentId))
  }

  return {
    team,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
    isEditing,
    draft,
    setDraft,
    startEditing,
    cancelEdit,
    save,
    isSaving: updateMutation.isPending,
    members,
    addMemberOpen,
    setAddMemberOpen,
    availableOpts,
    picked,
    setPicked,
    addMember,
    removeMember,
    recentProjects,
    statusOptions: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ],
  }
}
