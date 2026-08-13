import { delay, getDb, nextId } from '@/shared/mock/db'

export type TeamStatus = 'ACTIVE' | 'INACTIVE'

export interface Team {
  id: number
  name: string
  description?: string
  department?: string
  headName?: string
  headRole?: string
  projectName?: string
  memberCount: number
  projectCount: number
  status: TeamStatus
  createdAt: string
}

function asTeam(row: (typeof getDb.arguments extends never ? never : ReturnType<typeof getDb>)['teams'][number]): Team {
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

export async function getTeams(params?: { search?: string }): Promise<{ items: Team[]; total: number }> {
  await delay()
  let items = getDb().teams.map(asTeam)
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q) ||
        t.headName?.toLowerCase().includes(q)
    )
  }
  return { items, total: items.length }
}

export async function getTeam(id: number): Promise<Team | null> {
  await delay()
  const row = getDb().teams.find((t) => t.id === id)
  return row ? asTeam(row) : null
}

export async function updateTeam(
  id: number,
  patch: Partial<Pick<Team, 'name' | 'description' | 'department' | 'headName' | 'headRole' | 'status'>>
): Promise<Team> {
  await delay(400)
  const teams = getDb().teams
  const idx = teams.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Team not found')
  teams[idx] = {
    ...teams[idx],
    ...patch,
    description: patch.description ?? teams[idx].description,
    department: patch.department ?? teams[idx].department,
    headName: patch.headName ?? teams[idx].headName,
    headRole: patch.headRole ?? teams[idx].headRole,
  }
  return asTeam(teams[idx])
}

export async function createTeam(input: {
  name: string
  description?: string
}): Promise<Team> {
  await delay(500)
  const teams = getDb().teams
  const row = {
    id: nextId(teams),
    name: input.name,
    description: input.description ?? null,
    department: 'Engineering',
    headName: null as string | null,
    headRole: null as string | null,
    projectName: null as string | null,
    memberCount: 0,
    projectCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  teams.unshift(row)
  return asTeam(row)
}
