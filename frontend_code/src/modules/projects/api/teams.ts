/**
 * Teams API — env.useMockApi → shared mock DB; false → /projects/teams
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type { Team } from '../types'

export type { Team, TeamStatus } from '../types'

export interface TeamMemberRow {
  id: string
  name: string
  title: string
  role: string
  email: string
  status: 'Active' | 'On Leave'
  joined: string
}

export interface TeamProjectRow {
  id: number
  name: string
  client: string
  status: 'Active' | 'Completed' | 'On Hold'
  due: string
  pct: number
  role: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asTeam(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    department: row.department ?? undefined,
    headName: row.headName ?? undefined,
    headRole: row.headRole ?? undefined,
    projectName: row.projectName ?? undefined,
    memberCount: row.memberCount,
    projectCount: row.projectCount,
    status: row.status,
    createdAt: row.createdAt,
  }
}

/** Resolve primary teamId for a project (explicit field or match by projectName). */
export function resolveProjectTeamId(projectId: number): number | null {
  const db = getDb()
  const project = db.projects.find((p) => p.id === projectId) as
    | { id: number; name?: string; teamId?: number | null }
    | undefined
  if (!project) return null
  if (project.teamId != null) return project.teamId
  const byName = db.teams.find(
    (t) => t.projectName && project.name && t.projectName === project.name,
  )
  return byName?.id ?? null
}

export async function getTeams(params?: {
  search?: string
  /** ACTIVE | INACTIVE or UI Active | Inactive */
  status?: string
  department?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Team[]; total: number }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: Team[]; total: number }>('/projects/teams', {
      params,
    })
    return data
  }
  await delay()
  let items = getDb().teams.map(asTeam)
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q) ||
        t.headName?.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') {
    const wantActive =
      params.status === 'Active' || params.status === 'ACTIVE'
    const wantInactive =
      params.status === 'Inactive' || params.status === 'INACTIVE'
    items = items.filter((t) => {
      const active = t.status === 'ACTIVE'
      if (wantActive) return active
      if (wantInactive) return !active
      return true
    })
  }
  if (params?.department && params.department !== 'All') {
    const d = params.department.toLowerCase()
    items = items.filter((t) => (t.department ?? '').toLowerCase() === d)
  }
  if (params?.page != null || params?.pageSize != null) {
    return paginateItems(items, params.page, params.pageSize)
  }
  return { items, total: items.length }
}

export async function getTeam(id: number): Promise<Team | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<Team>(`/projects/teams/${id}`)
      return data
    } catch {
      return null
    }
  }
  await delay()
  const row = getDb().teams.find((t) => t.id === id)
  return row ? asTeam(row) : null
}

/** Teams linked to a project via teamId (or projectName fallback). */
export async function getTeamsForProject(projectId: number): Promise<Team[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: Team[] } | Team[]>(
      `/projects/${projectId}/teams`,
    )
    return Array.isArray(data) ? data : (data.items ?? [])
  }
  await delay()
  const teamId = resolveProjectTeamId(projectId)
  if (teamId == null) return []
  const team = getDb().teams.find((t) => t.id === teamId)
  return team ? [asTeam(team)] : []
}

export async function getTeamMembers(teamId: number): Promise<TeamMemberRow[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<TeamMemberRow[] | { items: TeamMemberRow[] }>(
      `/projects/teams/${teamId}/members`,
    )
    return Array.isArray(data) ? data : (data.items ?? [])
  }
  await delay()
  const db = getDb()
  const team = db.teams.find((t) => t.id === teamId)
  if (!team) return []

  const dept = (team.department ?? '').toLowerCase()
  let emps = db.employees.filter((e) => (e.department ?? '').toLowerCase() === dept)
  if (emps.length === 0) {
    emps = db.employees.slice(0, Math.max(team.memberCount, 3))
  } else if (emps.length > team.memberCount && team.memberCount > 0) {
    emps = emps.slice(0, team.memberCount)
  }

  const head = (team.headName ?? '').toLowerCase()
  const rows: TeamMemberRow[] = emps.map((e) => {
    const isHead = head && e.fullName.toLowerCase() === head
    return {
      id: String(e.id),
      name: e.fullName,
      title: e.role ?? 'Member',
      role: isHead ? 'Lead' : 'Member',
      email: e.email ?? '',
      status: e.status === 'ON_LEAVE' ? 'On Leave' : 'Active',
      joined: e.joiningDate ?? '—',
    }
  })

  rows.sort((a, b) => {
    if (a.role === 'Lead' && b.role !== 'Lead') return -1
    if (b.role === 'Lead' && a.role !== 'Lead') return 1
    return a.name.localeCompare(b.name)
  })

  return rows
}

function projectUiStatus(status: string): TeamProjectRow['status'] {
  if (status === 'COMPLETED') return 'Completed'
  if (status === 'ON_HOLD' || status === 'CANCELLED') return 'On Hold'
  return 'Active'
}

export async function getTeamProjects(teamId: number): Promise<TeamProjectRow[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<TeamProjectRow[] | { items: TeamProjectRow[] }>(
      `/projects/teams/${teamId}/projects`,
    )
    return Array.isArray(data) ? data : (data.items ?? [])
  }
  await delay()
  const db = getDb()
  const team = db.teams.find((t) => t.id === teamId)
  if (!team) return []

  const linked = db.projects.filter((p) => {
    const row = p as { teamId?: number | null; name?: string }
    if (row.teamId === teamId) return true
    if (team.projectName && row.name === team.projectName) return true
    return false
  })

  const list = linked.length > 0 ? linked : db.projects.slice(0, Math.max(team.projectCount, 1))

  return list.map((p) => {
    const end = p.endDate
      ? new Date(p.endDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—'
    return {
      id: p.id,
      name: p.name,
      client: p.clientName ?? '—',
      status: projectUiStatus(p.status),
      due: end,
      pct: p.progress ?? 0,
      role: team.projectName === p.name ? 'Primary' : 'Support',
    }
  })
}

export async function updateTeam(
  id: number,
  patch: Partial<
    Pick<Team, 'name' | 'description' | 'department' | 'headName' | 'headRole' | 'status'>
  >,
): Promise<Team> {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<Team>(`/projects/teams/${id}`, patch)
    return data
  }
  await delay(400)
  const teams = getDb().teams
  const idx = teams.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Team not found')
  teams[idx] = { ...teams[idx], ...patch }
  return asTeam(teams[idx])
}

export async function createTeam(input: {
  name: string
  description?: string
  headName?: string
  headRole?: string
  memberNames?: string[]
  projectId?: number
  projectName?: string
}): Promise<Team> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Team>('/projects/teams', input)
    return data
  }
  await delay(500)
  const db = getDb()
  const teams = db.teams
  const memberCount = (input.memberNames?.length ?? 0) + (input.headName ? 1 : 0)
  const row = {
    id: nextId(teams),
    name: input.name,
    description: input.description ?? null,
    department: 'Engineering',
    headName: input.headName ?? null,
    headRole: input.headRole ?? (input.headName ? 'Team Lead' : null),
    projectName: input.projectName ?? null,
    memberCount,
    projectCount: input.projectId ? 1 : 0,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
  }
  teams.unshift(row)

  if (input.projectId) {
    const pIdx = db.projects.findIndex((p) => p.id === input.projectId)
    if (pIdx !== -1) {
      db.projects[pIdx] = {
        ...db.projects[pIdx],
        teamId: row.id,
        teamCount: 1,
        updatedAt: new Date().toISOString(),
      }
      if (!row.projectName) {
        row.projectName = db.projects[pIdx].name
      }
    }
  }

  return asTeam(row)
}
