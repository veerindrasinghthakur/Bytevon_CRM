/**
 * Teams API — env.useMockApi → shared mock DB; false → /projects/teams
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type {
  Team,
  TeamStatus,
  TeamMemberRow,
  TeamProjectRow,
  TeamCandidate,
  TeamRow,
  EmployeeLike,
} from '../types'

export type { Team, TeamStatus } from '../types'

function mapApiTeam(row: Record<string, unknown>): Team {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    description: (row.description as string | null | undefined) ?? undefined,
    department: (row.department as string | undefined) ?? undefined,
    headName: (row.headName as string | undefined) ?? undefined,
    headRole: (row.headRole as string | undefined) ?? undefined,
    projectName: (row.projectName as string | undefined) ?? undefined,
    memberCount: Number(row.memberCount ?? row.member_count ?? 0),
    projectCount: Number(row.projectCount ?? row.project_count ?? 0),
    status: String(row.status ?? 'ACTIVE') as TeamStatus,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  }
}

function asTeam(row: TeamRow): Team {
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
    status: row.status as TeamStatus,
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
  status?: string
  department?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Team[]; total: number }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      { items: Team[]; total: number } | Array<Record<string, unknown>>
    >('/projects/teams', { params })
    if (Array.isArray(data)) {
      const items = data.map((r) => mapApiTeam(r))
      return { items, total: items.length }
    }
    return {
      items: (data.items ?? []).map((t) =>
        typeof t === 'object' && t && 'id' in t ? mapApiTeam(t as Record<string, unknown>) : t,
      ),
      total: data.total ?? data.items?.length ?? 0,
    }
  }
  await delay()
  let items = getDb().teams.map((t) => asTeam(t as TeamRow))
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
    const wantActive = params.status === 'Active' || params.status === 'ACTIVE'
    const wantInactive = params.status === 'Inactive' || params.status === 'INACTIVE'
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
      const { data } = await apiClient.get<Record<string, unknown>>(`/projects/teams/${id}`)
      return mapApiTeam(data)
    } catch {
      return null
    }
  }
  await delay()
  const row = getDb().teams.find((t) => t.id === id)
  return row ? asTeam(row as TeamRow) : null
}

/** Teams linked to a project via teamId (or projectName fallback). */
export async function getTeamsForProject(projectId: number): Promise<Team[]> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<{ items: Team[] } | Team[]>(
        `/projects/${projectId}/teams`,
      )
      return Array.isArray(data) ? data : (data.items ?? [])
    } catch {
      return []
    }
  }
  await delay()
  const teamId = resolveProjectTeamId(projectId)
  if (teamId == null) return []
  const team = getDb().teams.find((t) => t.id === teamId)
  return team ? [asTeam(team as TeamRow)] : []
}

export async function getTeamMembers(teamId: number): Promise<TeamMemberRow[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      Array<Record<string, unknown>> | { items: Array<Record<string, unknown>> }
    >(`/projects/teams/${teamId}/members`)
    const rows = Array.isArray(data) ? data : (data.items ?? [])
    return rows.map((r) => ({
      id: String(r.id ?? r.employment_id ?? ''),
      employmentId: Number(r.employment_id ?? r.employmentId ?? r.id ?? 0),
      name: String(r.name ?? r.fullName ?? `Member ${r.employment_id ?? r.id}`),
      title: String(r.team_role ?? r.teamRole ?? r.title ?? 'Member'),
      role: String(r.team_role ?? r.teamRole ?? 'Member'),
      email: String(r.email ?? ''),
      status: r.left_at || r.leftAt ? 'Inactive' : 'Active',
      joined: String(r.joined_at ?? r.joinedAt ?? '—'),
      isHead: String(r.team_role ?? r.teamRole ?? '').toLowerCase().includes('head'),
    }))
  }
  await delay()
  const db = getDb()
  const team = db.teams.find((t) => t.id === teamId) as TeamRow | undefined
  if (!team) return []

  const employees = db.employees as EmployeeLike[]
  const dept = (team.department ?? '').toLowerCase()
  let emps = employees.filter((e) => (e.department ?? '').toLowerCase() === dept)
  if (emps.length === 0) {
    emps = employees.slice(0, Math.max(team.memberCount, 3))
  } else if (emps.length > team.memberCount && team.memberCount > 0) {
    emps = emps.slice(0, team.memberCount)
  }

  const head = (team.headName ?? '').toLowerCase()
  const rows: TeamMemberRow[] = emps.map((e) => {
    const isHead = Boolean(head && e.fullName.toLowerCase() === head)
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
    try {
      const { data } = await apiClient.get<TeamProjectRow[] | { items: TeamProjectRow[] }>(
        `/projects/teams/${teamId}/projects`,
      )
      return Array.isArray(data) ? data : (data.items ?? [])
    } catch {
      return []
    }
  }
  await delay()
  const db = getDb()
  const team = db.teams.find((t) => t.id === teamId) as TeamRow | undefined
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

export async function getTeamCandidates(teamId: number): Promise<TeamCandidate[]> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<TeamCandidate[] | { items: TeamCandidate[] }>(
        `/projects/teams/${teamId}/candidates`,
      )
      return Array.isArray(data) ? data : (data.items ?? [])
    } catch {
      return []
    }
  }
  await delay()
  const db = getDb()
  const team = db.teams.find((t) => t.id === teamId) as TeamRow | undefined
  if (!team) return []

  const employees = db.employees as EmployeeLike[]
  const dept = (team.department ?? '').toLowerCase()

  const mapCandidate = (e: EmployeeLike): TeamCandidate => ({
    id: String(e.id),
    name: e.fullName,
    department: e.department ?? '—',
    years: e.joiningDate
      ? Math.floor((Date.now() - new Date(e.joiningDate).getTime()) / (365 * 24 * 60 * 60 * 1000))
      : 0,
    availability: e.status === 'ON_LEAVE' ? 'Busy' : 'Available',
  })

  const sameDept = employees.filter((e) => (e.department ?? '').toLowerCase() === dept)
  if (sameDept.length > 0) return sameDept.map(mapCandidate)
  return employees.map(mapCandidate)
}

export async function updateTeam(
  id: number,
  patch: Partial<
    Pick<Team, 'name' | 'description' | 'department' | 'headName' | 'headRole' | 'status'>
  > & { teamHeadEmploymentId?: number },
): Promise<Team> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.name != null) body.name = patch.name
    if (patch.description !== undefined) body.description = patch.description
    if (patch.teamHeadEmploymentId != null) body.team_head_employment_id = patch.teamHeadEmploymentId
    const { data } = await apiClient.patch<Record<string, unknown>>(`/projects/teams/${id}`, body)
    return mapApiTeam(data)
  }
  await delay(400)
  const teams = getDb().teams as TeamRow[]
  const idx = teams.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Team not found')
  teams[idx] = { ...teams[idx], ...patch } as TeamRow
  return asTeam(teams[idx])
}

export type CreateTeamApiInput = {
  name: string
  description?: string
  /** Required for real backend */
  teamHeadEmploymentId?: number
  headName?: string
  headRole?: string
  memberEmploymentIds?: number[]
  memberNames?: string[]
  projectId?: number
  projectName?: string
}

export async function createTeam(input: CreateTeamApiInput): Promise<Team> {
  if (!env.useMockApi) {
    if (input.teamHeadEmploymentId == null) {
      throw new Error('Team head is required')
    }
    const { data } = await apiClient.post<Record<string, unknown>>('/projects/teams', {
      name: input.name,
      description: input.description || null,
      team_head_employment_id: input.teamHeadEmploymentId,
    })
    const team = mapApiTeam(data)

    // Add extra members (head is auto-enrolled by backend)
    const memberIds = (input.memberEmploymentIds ?? []).filter(
      (id) => id !== input.teamHeadEmploymentId,
    )
    for (const employmentId of memberIds) {
      try {
        await apiClient.post(`/projects/teams/${team.id}/members`, {
          employment_id: employmentId,
          team_role: 'Member',
        })
      } catch {
        // non-fatal; team still created
      }
    }

    // Link project → TEAM assignment
    if (input.projectId != null && Number.isFinite(input.projectId)) {
      try {
        await apiClient.patch(`/projects/${input.projectId}`, {
          assignment_type: 'TEAM',
          assigned_to_id: team.id,
        })
      } catch {
        // team created; assignment may be retried from project detail
      }
    }

    return team
  }

  await delay(500)
  const db = getDb()
  const teams = db.teams as TeamRow[]
  const memberCount = (input.memberNames?.length ?? 0) + (input.headName ? 1 : 0)
  const row: TeamRow = {
    id: nextId(teams),
    name: input.name,
    description: input.description ?? null,
    department: 'Engineering',
    headName: input.headName ?? null,
    headRole: input.headRole ?? (input.headName ? 'Team Lead' : null),
    projectName: input.projectName ?? null,
    memberCount,
    projectCount: input.projectId ? 1 : 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  teams.unshift(row)

  if (input.projectId) {
    const pIdx = db.projects.findIndex((p) => p.id === input.projectId)
    if (pIdx !== -1) {
      const projects = db.projects as unknown as Array<Record<string, unknown>>
      const prev = (projects[pIdx] ?? {}) as Record<string, unknown>
      const next: Record<string, unknown> = {
        ...prev,
        teamId: row.id,
        teamCount: 1,
        updatedAt: new Date().toISOString(),
      }
      projects[pIdx] = next
      if (!row.projectName && typeof next.name === 'string') {
        row.projectName = next.name
      }
    }
  }

  return asTeam(row)
}
