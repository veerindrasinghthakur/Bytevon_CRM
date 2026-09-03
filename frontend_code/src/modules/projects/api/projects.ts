/**
 * Projects API — env.useMockApi → shared mock DB; false → GET/POST/PATCH /projects
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import type { CreateProjectInput, ProjectDetail, ProjectListItem } from '../schemas/project'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import { computeProjectListMetrics } from '@/shared/compute/project-metrics'

export type ProjectListMetrics = ReturnType<typeof computeProjectListMetrics>

export async function getProjects(params?: {
  search?: string
  status?: string
  teamId?: number
  page?: number
  pageSize?: number
}): Promise<{ items: ProjectListItem[]; total: number; metrics: ProjectListMetrics }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items: ProjectListItem[]
      total: number
      metrics?: ProjectListMetrics
    }>('/projects', { params })
    return {
      items: data.items,
      total: data.total,
      metrics: data.metrics ?? computeProjectListMetrics(data.items),
    }
  }
  await delay()
  let items = [...getDb().projects] as ProjectDetail[]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q),
    )
  }
  if (params?.status) {
    items = items.filter((p) => p.status === params.status)
  }
  if (params?.teamId != null) {
    items = items.filter((p) => p.teamId === params.teamId)
  }
  const metrics = computeProjectListMetrics(items)
  if (params?.page != null || params?.pageSize != null) {
    const page = paginateItems(items, params.page, params.pageSize)
    return { ...page, metrics }
  }
  return { items, total: items.length, metrics }
}

export async function getProjectById(id: number): Promise<ProjectDetail | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<ProjectDetail>(`/projects/${id}`)
      return data
    } catch {
      return null
    }
  }
  await delay()
  const row = getDb().projects.find((p) => p.id === id)
  return (row as ProjectDetail | undefined) ?? null
}

/** Projects linked to a team via teamId. */
export async function getProjectsForTeam(teamId: number): Promise<ProjectListItem[]> {
  const { items } = await getProjects({ teamId })
  return items
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDetail> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<ProjectDetail>('/projects', input)
    return data
  }
  await delay(500)
  const projects = getDb().projects
  const id = nextId(projects)
  const newProject: ProjectDetail = {
    id,
    name: input.name,
    code: input.code || `PRJ-${id}`,
    status: 'PLANNING',
    clientName: input.clientName ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    progress: 0,
    teamCount: input.teamId ? 1 : 0,
    taskCount: 0,
    teamId: input.teamId ?? null,
    description: input.description ?? null,
    repositoryUrl: input.repositoryUrl ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  projects.unshift(newProject as (typeof projects)[number])
  return newProject
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
      | 'teamId'
      | 'teamCount'
    >
  >,
): Promise<ProjectDetail> {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<ProjectDetail>(`/projects/${id}`, patch)
    return data
  }
  await delay(400)
  const projects = getDb().projects
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('Project not found')
  const current = projects[idx] as ProjectDetail
  const next: ProjectDetail = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  if (patch.teamId !== undefined) {
    next.teamCount = patch.teamId != null ? Math.max(1, next.teamCount ?? 1) : 0
  }
  projects[idx] = next as (typeof projects)[number]
  return next
}
