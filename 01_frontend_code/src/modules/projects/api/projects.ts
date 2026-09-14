/**
 * Projects API — env.useMockApi → shared mock DB; false → GET/POST/PATCH /projects
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import type { CreateProjectInput, ProjectDetail, ProjectListItem } from '../schemas/project'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type { ProjectListMetrics } from '../types'
import { computeProjectListMetrics } from '@/shared/compute/project-metrics'

function normalizeProjectStatus(raw: unknown): ProjectDetail['status'] {
  const s = String(raw ?? 'PLANNING').toUpperCase()
  const map: Record<string, ProjectDetail['status']> = {
    PLANNING: 'PLANNING',
    PLANNED: 'PLANNING',
    IN_PROGRESS: 'IN_PROGRESS',
    ACTIVE: 'IN_PROGRESS',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    ARCHIVED: 'CANCELLED',
  }
  return map[s] ?? 'PLANNING'
}

function mapApiProject(row: Record<string, unknown>): ProjectDetail {
  const id = Number(row.id)
  const name = String(row.project_name ?? row.projectName ?? row.name ?? '')
  return {
    id,
    name,
    code: (row.code as string) ?? `PRJ-${id}`,
    status: normalizeProjectStatus(row.status),
    clientName: (row.clientName as string) ?? (row.client_name as string) ?? null,
    startDate: (row.planned_start_date as string) ?? (row.startDate as string) ?? null,
    endDate: (row.planned_end_date as string) ?? (row.endDate as string) ?? null,
    progress: Number(row.progress ?? 0),
    teamCount: Number(row.teamCount ?? 0),
    taskCount: Number(row.taskCount ?? 0),
    teamId:
      row.assignment_type === 'TEAM' || row.assignmentType === 'TEAM'
        ? Number(row.assigned_to_id ?? row.assignedToId ?? 0) || null
        : (row.teamId as number | null) ?? null,
    description: (row.description as string) ?? null,
    repositoryUrl:
      (row.repository_reference as string) ?? (row.repositoryUrl as string) ?? null,
    createdAt: (row.created_at as string) ?? (row.createdAt as string) ?? null,
    updatedAt: (row.updated_at as string) ?? (row.updatedAt as string) ?? null,
  }
}

export async function getProjects(params?: {
  search?: string
  status?: string
  teamId?: number
  page?: number
  pageSize?: number
}): Promise<{ items: ProjectListItem[]; total: number; metrics: ProjectListMetrics }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      | { items: ProjectListItem[]; total: number; metrics?: ProjectListMetrics }
      | Array<Record<string, unknown>>
    >('/projects', { params })
    if (Array.isArray(data)) {
      const items = data.map((r) => mapApiProject(r))
      return { items, total: items.length, metrics: computeProjectListMetrics(items) }
    }
    const items = (data.items ?? []).map((row) =>
      typeof row === 'object' && row && 'project_name' in (row as object)
        ? mapApiProject(row as Record<string, unknown>)
        : mapApiProject({ ...(row as object), status: (row as ProjectListItem).status }),
    )
    return {
      items,
      total: data.total ?? items.length,
      metrics: data.metrics ?? computeProjectListMetrics(items),
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
      const { data } = await apiClient.get<Record<string, unknown>>(`/projects/${id}`)
      return mapApiProject(data)
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

function toBackendCreate(input: CreateProjectInput): Record<string, unknown> {
  const assignmentType =
    input.assignmentType ??
    (input.teamId != null ? 'TEAM' : 'INDIVIDUAL')
  const assignedToId =
    assignmentType === 'TEAM'
      ? input.teamId
      : input.assignedEmploymentId ?? input.teamId

  return {
    client_id: input.clientId,
    project_name: input.name,
    description: input.description || null,
    assignment_type: assignmentType,
    assigned_to_id: assignedToId,
    repository_reference: input.repositoryUrl || null,
    planned_start_date: input.startDate || null,
    planned_end_date: input.endDate || null,
  }
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDetail> {
  if (!env.useMockApi) {
    if (input.clientId == null) {
      throw new Error('Client is required')
    }
    const body = toBackendCreate(input)
    if (body.assigned_to_id == null) {
      throw new Error('Assignee (team or employee) is required')
    }
    const { data } = await apiClient.post<Record<string, unknown>>('/projects', body)
    return mapApiProject(data)
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
  > & {
    assignmentType?: 'TEAM' | 'INDIVIDUAL'
    assignedToId?: number
  },
): Promise<ProjectDetail> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.name != null) body.project_name = patch.name
    if (patch.description !== undefined) body.description = patch.description
    if (patch.repositoryUrl !== undefined) body.repository_reference = patch.repositoryUrl
    if (patch.startDate !== undefined) body.planned_start_date = patch.startDate
    if (patch.endDate !== undefined) body.planned_end_date = patch.endDate
    if (patch.status != null) body.status = patch.status
    if (patch.assignmentType != null) body.assignment_type = patch.assignmentType
    if (patch.assignedToId != null) body.assigned_to_id = patch.assignedToId
    if (patch.teamId != null) {
      body.assignment_type = 'TEAM'
      body.assigned_to_id = patch.teamId
    }
    const { data } = await apiClient.patch<Record<string, unknown>>(`/projects/${id}`, body)
    return mapApiProject(data)
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
