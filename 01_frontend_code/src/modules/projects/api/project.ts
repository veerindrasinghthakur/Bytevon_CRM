/**
 * Projects API — env.useMockApi → shared mock DB; false → GET/POST/PATCH /projects
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import type { CreateProjectInput, ProjectDetail, ProjectListItem } from '../schemas/project/project'
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

function resolveClientName(row: Record<string, unknown>): string | null {
  const direct =
    (row.client_name as string | undefined) ??
    (row.clientName as string | undefined) ??
    null
  if (direct && String(direct).trim()) return String(direct)

  const nested = row.client
  if (nested && typeof nested === 'object') {
    const n = (nested as Record<string, unknown>).name ?? (nested as Record<string, unknown>).client_name
    if (n != null && String(n).trim()) return String(n)
  }

  const clientId = Number(row.client_id ?? row.clientId ?? 0)
  if (!Number.isFinite(clientId) || clientId <= 0) return null

  try {
    const db = getDb() as ReturnType<typeof getDb> & {
      clients?: Array<{ id: number | string; name?: string }>
    }
    const clients = db.clients ?? []
    const hit = clients.find((c) => Number(c.id) === clientId || String(c.id) === String(clientId))
    if (hit?.name) return hit.name
  } catch {
    // ignore
  }
  return null
}

function mapApiProject(row: Record<string, unknown>): ProjectDetail {
  const id = Number(row.id)
  const name = String(row.project_name ?? row.projectName ?? row.name ?? '')
  const assignmentType = String(row.assignment_type ?? row.assignmentType ?? '')
  const assignedTo = Number(row.assigned_to_id ?? row.assignedToId ?? 0) || null
  const teamId =
    assignmentType === 'TEAM'
      ? assignedTo
      : (row.team_id as number | null) ?? (row.teamId as number | null) ?? null

  return {
    id,
    name,
    code: (row.code as string) ?? `PRJ-${id}`,
    status: normalizeProjectStatus(row.status),
    clientName: resolveClientName(row),
    startDate:
      (row.planned_start_date as string) ?? (row.startDate as string) ?? null,
    endDate: (row.planned_end_date as string) ?? (row.endDate as string) ?? null,
    progress: Number(row.progress ?? 0),
    teamCount: Number(row.team_count ?? row.teamCount ?? (teamId ? 1 : 0)),
    taskCount: Number(row.task_count ?? row.taskCount ?? 0),
    openTasks: Number(row.open_tasks ?? row.openTasks ?? 0),
    daysToDeadline:
      row.days_to_deadline != null
        ? Number(row.days_to_deadline)
        : row.daysToDeadline != null
          ? Number(row.daysToDeadline)
          : null,
    teamMemberCount: Number(row.team_member_count ?? row.teamMemberCount ?? 0),
    teamName: (row.team_name as string) ?? (row.teamName as string) ?? null,
    teamHeadName:
      (row.team_head_name as string) ?? (row.teamHeadName as string) ?? null,
    teamId,
    description: (row.description as string) ?? null,
    repositoryUrl:
      (row.repository_reference as string) ?? (row.repositoryUrl as string) ?? null,
    createdAt: (row.created_at as string) ?? (row.createdAt as string) ?? null,
    updatedAt: (row.updated_at as string) ?? (row.updatedAt as string) ?? null,
  }
}

function enrichMockProject(p: ProjectDetail): ProjectDetail {
  if (p.clientName && String(p.clientName).trim()) return p
  const row = p as ProjectDetail & { clientId?: number | null }
  if (row.clientId == null) return p
  const db = getDb() as ReturnType<typeof getDb> & {
    clients?: Array<{ id: number | string; name?: string }>
  }
  const hit = (db.clients ?? []).find(
    (c) => Number(c.id) === Number(row.clientId) || String(c.id) === String(row.clientId),
  )
  if (!hit?.name) return p
  return { ...p, clientName: hit.name }
}

export async function getProjects(params?: {
  search?: string
  status?: string
  teamId?: number
  /** When true, only projects with no team assignment */
  unassignedOnly?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: ProjectListItem[]; total: number; metrics: ProjectListMetrics }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      | { items: ProjectListItem[]; total: number; metrics?: ProjectListMetrics }
      | Array<Record<string, unknown>>
    >('/projects/', {
      params: {
        search: params?.search,
        status: params?.status,
        team_id: params?.teamId,
        unassigned: params?.unassignedOnly ? true : undefined,
        page: params?.page,
        page_size: params?.pageSize,
      },
    })
    if (Array.isArray(data)) {
      let items = data.map((r) => mapApiProject(r))
      if (params?.unassignedOnly) {
        items = items.filter((p) => p.teamId == null)
      }
      if (params?.teamId != null) {
        items = items.filter((p) => p.teamId === params.teamId)
      }
      return { items, total: items.length, metrics: computeProjectListMetrics(items) }
    }
    let items = (data.items ?? []).map((row) =>
      mapApiProject(row as unknown as Record<string, unknown>),
    )
    if (params?.unassignedOnly) {
      items = items.filter((p) => p.teamId == null)
    }
    return {
      items,
      total: data.total ?? items.length,
      metrics: data.metrics ?? computeProjectListMetrics(items),
    }
  }
  await delay()
  let items = ([...getDb().projects] as ProjectDetail[]).map(enrichMockProject)
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
  if (params?.unassignedOnly) {
    items = items.filter((p) => p.teamId == null)
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
  if (!row) return null
  return enrichMockProject(row as ProjectDetail)
}

export async function getProjectsForTeam(teamId: number): Promise<ProjectListItem[]> {
  const { items } = await getProjects({ teamId })
  return items
}

function toBackendCreate(input: CreateProjectInput): Record<string, unknown> {
  const assignmentType =
    input.assignmentType ?? (input.teamId != null ? 'TEAM' : 'INDIVIDUAL')
  const assignedToId =
    assignmentType === 'TEAM' ? input.teamId : input.assignedEmploymentId ?? input.teamId

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
    const { data } = await apiClient.post<Record<string, unknown>>('/projects/', body)
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
    openTasks: 0,
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
  return enrichMockProject(next)
}
