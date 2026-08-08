import type { CreateProjectInput, ProjectDetail, ProjectListItem } from '../schemas/project'

/** Mock data – replace with real API when backend is ready */
const MOCK_PROJECTS: ProjectDetail[] = [
  {
    id: 1,
    name: 'Bytevon CRM Core',
    code: 'BV-CRM',
    status: 'IN_PROGRESS',
    clientName: 'Internal',
    startDate: '2026-01-15',
    endDate: '2026-09-30',
    progress: 42,
    teamCount: 4,
    taskCount: 28,
    description: 'Core ERP/CRM platform development.',
    repositoryUrl: 'https://github.com/veerindrasinghthakur/bytevon_documentation',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-08-07T14:30:00Z',
  },
  {
    id: 2,
    name: 'Client Portal',
    code: 'BV-PORTAL',
    status: 'PLANNING',
    clientName: 'Nexus Global',
    startDate: '2026-09-01',
    endDate: null,
    progress: 5,
    teamCount: 2,
    taskCount: 6,
    description: 'External client self-service portal.',
    createdAt: '2026-07-20T09:00:00Z',
    updatedAt: '2026-08-01T11:00:00Z',
  },
  {
    id: 3,
    name: 'Mobile Attendance',
    code: 'BV-ATT',
    status: 'ON_HOLD',
    clientName: 'Internal',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    progress: 60,
    teamCount: 3,
    taskCount: 15,
    description: 'Mobile app for attendance marking.',
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-05-12T16:00:00Z',
  },
]

function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getProjects(params?: {
  search?: string
  status?: string
}): Promise<{ items: ProjectListItem[]; total: number }> {
  await delay()
  let items = [...MOCK_PROJECTS]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q)
    )
  }
  if (params?.status) {
    items = items.filter((p) => p.status === params.status)
  }
  return { items, total: items.length }
}

export async function getProjectById(id: number): Promise<ProjectDetail | null> {
  await delay()
  return MOCK_PROJECTS.find((p) => p.id === id) ?? null
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDetail> {
  await delay(600)
  const newProject: ProjectDetail = {
    id: MOCK_PROJECTS.length + 1,
    name: input.name,
    code: input.code,
    status: 'PLANNING',
    clientName: input.clientName,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    progress: 0,
    teamCount: 0,
    taskCount: 0,
    description: input.description,
    repositoryUrl: input.repositoryUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  MOCK_PROJECTS.push(newProject)
  return newProject
}