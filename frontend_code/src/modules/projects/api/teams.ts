export type TeamStatus = 'ACTIVE' | 'INACTIVE'

export interface Team {
  id: number
  name: string
  description?: string
  projectName?: string
  memberCount: number
  status: TeamStatus
  createdAt: string
}

const MOCK_TEAMS: Team[] = [
  {
    id: 1,
    name: 'Alpha Engineering',
    description: 'Core platform development team',
    projectName: 'Bytevon CRM Core',
    memberCount: 6,
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Beta Design',
    description: 'UI/UX and design system',
    projectName: 'Bytevon CRM Core',
    memberCount: 3,
    status: 'ACTIVE',
    createdAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 3,
    name: 'Client Portal Squad',
    description: 'External portal delivery',
    projectName: 'Client Portal',
    memberCount: 4,
    status: 'ACTIVE',
    createdAt: '2026-07-01T11:00:00Z',
  },
  {
    id: 4,
    name: 'Mobile Ops',
    description: 'Attendance mobile app',
    projectName: 'Mobile Attendance',
    memberCount: 2,
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
        t.projectName?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    )
  }
  return { items, total: items.length }
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
    projectName: undefined,
    memberCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  }
  MOCK_TEAMS.unshift(team)
  return team
}
