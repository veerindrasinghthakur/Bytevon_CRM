import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteTeam,
  getTeam,
  getTeamMemberHistory,
  getTeamMembers,
  getTeamProjects,
  removeTeamMember,
  updateTeam,
} from '../../api/team'
import type {
  Team as ProjectsTeam,
  TeamMemberRow,
  TeamProjectRow,
} from '../../types'
import { queryKeys } from '@/shared/lib/query-keys'
import { toast } from '@/shared/hooks/use-toast'
import { getApiErrorMessage } from '@/shared/lib/api-error'

/** UI team shape used by list/detail pages (string id for route params). */
export type TeamUi = {
  id: string
  name: string
  description?: string
  departmentId: string
  department: string
  headName: string
  headTitle?: string
  memberCount: number
  projectCount: number
  status: 'Active' | 'Inactive'
  createdOn?: string
  mission?: string
  icon?: string
  velocity?: number
}

function toTeamUi(t: ProjectsTeam): TeamUi {
  return {
    id: String(t.id),
    name: t.name,
    description: t.description,
    departmentId: '',
    department: t.department ?? '—',
    headName: t.headName ?? 'Unassigned',
    headTitle: t.headRole,
    memberCount: t.memberCount,
    projectCount: t.projectCount,
    status: t.status === 'ACTIVE' ? 'Active' : 'Inactive',
    createdOn: t.createdAt
      ? new Date(t.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : undefined,
    mission: t.description,
    icon: 'groups',
  }
}

export function useTeamDetail(teamIdParam: string | undefined) {
  const numericId = teamIdParam != null ? Number(teamIdParam) : NaN
  const enabled = Number.isFinite(numericId)
  const qc = useQueryClient()

  const teamQuery = useQuery({
    queryKey: queryKeys.teams.detail(numericId),
    queryFn: () => getTeam(numericId),
    enabled,
  })

  const membersQuery = useQuery({
    queryKey: queryKeys.teams.members(numericId),
    queryFn: () => getTeamMembers(numericId),
    enabled: enabled && teamQuery.isSuccess && teamQuery.data != null,
  })

  const historyQuery = useQuery({
    queryKey: [...queryKeys.teams.members(numericId), 'history'],
    queryFn: () => getTeamMemberHistory(numericId),
    enabled: enabled && teamQuery.isSuccess && teamQuery.data != null,
  })

  const projectsQuery = useQuery({
    queryKey: queryKeys.teams.projects(numericId),
    queryFn: () => getTeamProjects(numericId),
    enabled: enabled && teamQuery.isSuccess && teamQuery.data != null,
  })

  const team = useMemo(
    () => (teamQuery.data ? toTeamUi(teamQuery.data) : null),
    [teamQuery.data],
  )

  const members: TeamMemberRow[] = membersQuery.data ?? []
  const history: TeamMemberRow[] = historyQuery.data ?? []
  const projects: TeamProjectRow[] = projectsQuery.data ?? []

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.teams.detail(numericId) })
    void qc.invalidateQueries({ queryKey: queryKeys.teams.members(numericId) })
    void qc.invalidateQueries({ queryKey: queryKeys.teams.projects(numericId) })
    void qc.invalidateQueries({ queryKey: queryKeys.teams.all })
  }

  const removeMut = useMutation({
    mutationFn: (employmentId: number) => removeTeamMember(numericId, employmentId),
    onSuccess: () => {
      toast.success('Member removed — kept in history')
      invalidateAll()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not remove member')),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteTeam(numericId),
    onSuccess: () => {
      toast.success('Team deleted')
      invalidateAll()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not delete team')),
  })

  const changeHeadMut = useMutation({
    mutationFn: (headEmploymentId: number) =>
      updateTeam(numericId, { teamHeadEmploymentId: headEmploymentId }),
    onSuccess: () => {
      toast.success('Team head updated')
      invalidateAll()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not update team head')),
  })

  return {
    teamId: enabled ? numericId : null,
    team,
    members,
    history,
    projects,
    isLoading: teamQuery.isLoading,
    isError: teamQuery.isError || (!teamQuery.isLoading && team == null && enabled),
    detailError: teamQuery.error ?? null,
    isMembersLoading: membersQuery.isLoading,
    isProjectsLoading: projectsQuery.isLoading,
    removeMember: (employmentId: number) => removeMut.mutate(employmentId),
    isRemoving: removeMut.isPending,
    deleteTeam: () => deleteMut.mutate(),
    isDeleting: deleteMut.isPending,
    changeHead: (headEmploymentId: number) => changeHeadMut.mutate(headEmploymentId),
    isChangingHead: changeHeadMut.isPending,
    refetch: () => {
      void teamQuery.refetch()
      void membersQuery.refetch()
      void historyQuery.refetch()
      void projectsQuery.refetch()
    },
  }
}
