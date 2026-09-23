import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getTeam,
  getTeamMembers,
  getTeamProjects,
} from '../../api/team'
import type {
  Team as ProjectsTeam,
  TeamMemberRow,
  TeamProjectRow,
} from '../../types'
import { queryKeys } from '@/shared/lib/query-keys'

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
  const projects: TeamProjectRow[] = projectsQuery.data ?? []

  return {
    teamId: enabled ? numericId : null,
    team,
    members,
    projects,
    isLoading: teamQuery.isLoading,
    isError: teamQuery.isError || (!teamQuery.isLoading && team == null && enabled),
    detailError: teamQuery.error ?? null,
    isMembersLoading: membersQuery.isLoading,
    isProjectsLoading: projectsQuery.isLoading,
    refetch: () => {
      void teamQuery.refetch()
      void membersQuery.refetch()
      void projectsQuery.refetch()
    },
  }
}
