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

const MOCK_TEAMS: Team[] = [
  {
    id: 1,
    name: 'Alpha Engineering',
    description: 'Core backend architecture and API development team.',
    department: 'Engineering',
    headName: 'Sarah Jenkins',
    headRole: 'Tech Lead',
    projectName: 'Bytevon CRM Core',
    memberCount: 12,
    projectCount: 4,
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Brand Creative',
    description: 'UI/UX and design system',
    department: 'Design',
    headName: 'David Chen',
    headRole: 'Design Director',
    projectName: 'Client Portal',
    memberCount: 8,
    projectCount: 2,
    status: 'ACTIVE',
    createdAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 3,
    name: 'Client Portal Squad',
    description: 'External portal delivery',
    department: 'Engineering',
    headName: 'Marcus Sterling',
    headRole: 'Project Lead',
    projectName: 'Client Portal',
    memberCount: 4,
    projectCount: 1,
    status: 'ACTIVE',
    createdAt: '2026-07-01T11:00:00Z',
  },
  {
    id: 4,
    name: 'Mobile Ops',
    description: 'Attendance mobile app',
    department: 'Engineering',
    headName: 'Elena R.',
    headRole: 'Mobile Lead',
    projectName: 'Mobile Attendance',
    memberCount: 2,
    projectCount: 1,
    status: 'INACTIVE',
    createdAt: '2026-04-10T08:00:00Z',
  },
]

function delay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getTeams(params?: { search?: string }): Promise<{ items: Team[]; total: number }> {
  await delay()
  let items = [...MOCK_TEAMS]
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
  return MOCK_TEAMS.find((t) => t.id === id) ?? null
}

export async function updateTeam(
  id: number,
  patch: Partial<Pick<Team, 'name' | 'description' | 'department' | 'headName' | 'headRole' | 'status'>>
): Promise<Team> {
  await delay(400)
  const idx = MOCK_TEAMS.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Team not found')
  MOCK_TEAMS[idx] = { ...MOCK_TEAMS[idx], ...patch }
  return MOCK_TEAMS[idx]
}

export async function createTeam(input: {
  name: string
  description?: string
}): Promise<Team> {
  await delay(500)
  const team: Team = {
    id: MOCK_TEAMS.length + 1 + Math.floor(Math.random() * 1000),
    name: input.name,
    description: input.description,
    department: 'Engineering',
    headName: undefined,
    headRole: undefined,
    memberCount: 0,
    projectCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  MOCK_TEAMS.unshift(team)
  return team
}
