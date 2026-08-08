import type { CreateProjectInput, ProjectDetail, ProjectListItem } from '../schemas/project'

/** Mock aligned with Stitch projects table */
const MOCK_PROJECTS: ProjectDetail[] = [
  {
    id: 1024,
    name: 'ERP Migration Phase 2',
    code: 'PRJ-1024',
    status: 'IN_PROGRESS',
    clientName: 'TechNexus Corp.',
    startDate: '2026-01-15',
    endDate: '2026-12-15',
    progress: 65,
    teamCount: 4,
    taskCount: 28,
    description: 'Infrastructure upgrade and data migration for the core ERP system.',
    repositoryUrl: 'https://github.com/example/erp',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-08-07T14:30:00Z',
  },
  {
    id: 1025,
    name: 'Global Logistics Audit',
    code: 'PRJ-1025',
    status: 'PLANNING',
    clientName: 'Global Logistics Ltd.',
    startDate: '2026-09-01',
    endDate: '2026-01-22',
    progress: 0,
    teamCount: 2,
    taskCount: 6,
    description: 'Consulting audit for logistics operations.',
    createdAt: '2026-07-20T09:00:00Z',
    updatedAt: '2026-08-01T11:00:00Z',
  },
  {
    id: 1026,
    name: 'Fintech Rollout V3',
    code: 'PRJ-1026',
    status: 'ON_HOLD',
    clientName: 'Chen Financial Group',
    startDate: '2026-03-01',
    endDate: '2026-02-08',
    progress: 82,
    teamCount: 5,
    taskCount: 41,
    description: 'Product development rollout for fintech clients.',
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-05-12T16:00:00Z',
  },
  {
    id: 1027,
    name: 'Bytevon CRM Core',
    code: 'PRJ-1027',
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
    id: 2000 + MOCK_PROJECTS.length,
    name: input.name,
    code: input.code || `PRJ-${2000 + MOCK_PROJECTS.length}`,
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
  MOCK_PROJECTS.unshift(newProject)
  return newProject
}
