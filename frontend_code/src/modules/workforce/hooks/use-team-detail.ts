import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getTeam,
  getTeamMembers,
  getTeamProjects,
  type TeamMemberRow,
  type TeamProjectRow,
} from '@/modules/projects/api/teams'
import type { Team as ProjectsTeam } from '@/modules/projects/types'
import type { Team } from '../types'
import { queryKeys } from '@/shared/lib/query-keys'

function toWorkforceTeam(t: ProjectsTeam): Team {
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
    () => (teamQuery.data ? toWorkforceTeam(teamQuery.data) : null),
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
    isMembersLoading: membersQuery.isLoading,
    isProjectsLoading: projectsQuery.isLoading,
    refetch: () => {
      void teamQuery.refetch()
      void membersQuery.refetch()
      void projectsQuery.refetch()
    },
  }
}
