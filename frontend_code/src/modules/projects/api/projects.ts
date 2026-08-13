import type { CreateProjectInput, ProjectDetail, ProjectListItem } from '../schemas/project'
import { delay, getDb, nextId } from '@/shared/mock/db'

export async function getProjects(params?: {
  search?: string
  status?: string
}): Promise<{ items: ProjectListItem[]; total: number }> {
  await delay()
  let items = [...getDb().projects] as ProjectDetail[]
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
  const row = getDb().projects.find((p) => p.id === id)
  return (row as ProjectDetail | undefined) ?? null
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDetail> {
  await delay(500)
  const projects = getDb().projects
  const id = nextId(projects)
  const newProject = {
    id,
    name: input.name,
    code: input.code || `PRJ-${id}`,
    status: 'PLANNING' as const,
    clientId: null as number | null,
    clientName: input.clientName ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    progress: 0,
    teamCount: 0,
    taskCount: 0,
    description: input.description ?? null,
    repositoryUrl: input.repositoryUrl ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  projects.unshift(newProject)
  return newProject as ProjectDetail
}

export async function updateProject(
  id: number,
  patch: Partial<
    Pick<
      ProjectDetail,
      | 'name'
      | 'code'
      | 'status'
      | 'clientName'
      | 'startDate'
      | 'endDate'
      | 'progress'
      | 'description'
      | 'repositoryUrl'
    >
  >
): Promise<ProjectDetail> {
  await delay(400)
  const projects = getDb().projects
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('Project not found')
  projects[idx] = {
    ...projects[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  return projects[idx] as ProjectDetail
}
