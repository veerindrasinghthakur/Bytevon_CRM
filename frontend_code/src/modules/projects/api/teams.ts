import { delay, getDb, nextId } from '@/shared/mock/db'
import type { Team } from '../types'

export type { Team, TeamStatus } from '../types'

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
  // Fallback: team whose projectName matches this project
  const byName = db.teams.find(
    (t) => t.projectName && project.name && t.projectName === project.name,
  )
  return byName?.id ?? null
}

export async function getTeams(params?: { search?: string }): Promise<{ items: Team[]; total: number }> {
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
  return { items, total: items.length }
}

export async function getTeam(id: number): Promise<Team | null> {
  await delay()
  const row = getDb().teams.find((t) => t.id === id)
  return row ? asTeam(row) : null
}

/** Teams linked to a project via teamId (or projectName fallback). */
export async function getTeamsForProject(projectId: number): Promise<Team[]> {
  await delay()
  const teamId = resolveProjectTeamId(projectId)
  if (teamId == null) return []
  const team = getDb().teams.find((t) => t.id === teamId)
  return team ? [asTeam(team)] : []
}

export async function updateTeam(
  id: number,
  patch: Partial<Pick<Team, 'name' | 'description' | 'department' | 'headName' | 'headRole' | 'status'>>,
): Promise<Team> {
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
