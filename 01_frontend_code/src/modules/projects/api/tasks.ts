/**
 * Tasks API — env.useMockApi → shared mock DB; false → /projects/tasks
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type { Task, TaskPriority, TaskStatus, TaskRow } from '../types'

export type { Task, TaskPriority, TaskStatus } from '../types'

function mapApiTask(row: Record<string, unknown>): Task {
  const statusRaw = String(row.status ?? 'TODO').toUpperCase()
  const statusMap: Record<string, TaskStatus> = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    IN_REVIEW: 'IN_REVIEW',
    DONE: 'DONE',
    COMPLETED: 'DONE',
    BLOCKED: 'BLOCKED',
    ON_HOLD: 'ON_HOLD',
  }
  const assigneeId = row.assignee_employment_id ?? row.assigneeEmploymentId
  const assigneeName =
    (row.assignee_name as string | undefined) ??
    (row.assigneeName as string | undefined) ??
    (row.assignee as string | undefined) ??
    undefined
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    description: (row.description as string | undefined) ?? undefined,
    priority: String(row.priority ?? 'MEDIUM').toUpperCase() as TaskPriority,
    status: statusMap[statusRaw] ?? 'TODO',
    projectId: Number(row.project_id ?? row.projectId ?? 0),
    projectName:
      (row.project_name as string | undefined) ??
      (row.projectName as string | undefined) ??
      undefined,
    assigneeName: assigneeName || undefined,
    assigneeEmploymentId:
      assigneeId != null && Number.isFinite(Number(assigneeId)) ? Number(assigneeId) : null,
    dueDate: (row.due_date as string | null | undefined) ?? (row.dueDate as string | null) ?? null,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  }
}

function asTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    projectId: row.projectId,
    projectName: row.projectName ?? undefined,
    assigneeName: row.assigneeName ?? undefined,
    dueDate: row.dueDate ?? null,
    createdAt: row.createdAt,
  }
}

export async function getTasks(params?: {
  search?: string
  status?: string
  projectId?: number
  page?: number
  pageSize?: number
}): Promise<{ items: Task[]; total: number }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      { items: Task[]; total: number } | Array<Record<string, unknown>>
    >('/projects/tasks', {
      params: {
        project_id: params?.projectId,
        limit: params?.pageSize ?? 200,
        offset:
          params?.page != null && params?.pageSize != null
            ? (Math.max(params.page, 1) - 1) * params.pageSize
            : 0,
      },
    })
    let items = Array.isArray(data)
      ? data.map((r) => mapApiTask(r))
      : (data.items ?? []).map((t) =>
          typeof t === 'object' && t && ('project_id' in (t as object) || 'id' in (t as object))
            ? mapApiTask(t as unknown as Record<string, unknown>)
            : (t as Task),
        )
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.projectName?.toLowerCase().includes(q) ||
          t.assigneeName?.toLowerCase().includes(q),
      )
    }
    if (params?.status) {
      items = items.filter((t) => t.status === params.status)
    }
    return { items, total: Array.isArray(data) ? items.length : (data.total ?? items.length) }
  }
  await delay()
  let items = getDb().tasks.map((t) => asTask(t as TaskRow))
  if (params?.projectId != null) {
    items = items.filter((t) => t.projectId === params.projectId)
  }
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.projectName?.toLowerCase().includes(q) ||
        t.assigneeName?.toLowerCase().includes(q),
    )
  }
  if (params?.status) {
    items = items.filter((t) => t.status === params.status)
  }
  if (params?.page != null || params?.pageSize != null) {
    return paginateItems(items, params.page, params.pageSize)
  }
  return { items, total: items.length }
}

export async function getTask(id: number): Promise<Task | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<Record<string, unknown>>(`/projects/tasks/${id}`)
      return mapApiTask(data)
    } catch {
      return null
    }
  }
  await delay()
  const row = getDb().tasks.find((t) => t.id === id)
  return row ? asTask(row as TaskRow) : null
}

export async function updateTask(
  id: number,
  patch: Partial<
    Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'assigneeName' | 'dueDate'>
  > & { assigneeEmploymentId?: number | null },
): Promise<Task> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.title != null) body.title = patch.title
    if (patch.description !== undefined) body.description = patch.description
    if (patch.priority != null) body.priority = patch.priority
    if (patch.status != null) body.status = patch.status
    if (patch.dueDate !== undefined) body.due_date = patch.dueDate
    if (patch.assigneeEmploymentId !== undefined)
      body.assignee_employment_id = patch.assigneeEmploymentId
    const { data } = await apiClient.patch<Record<string, unknown>>(`/projects/tasks/${id}`, body)
    return mapApiTask(data)
  }
  await delay(400)
  const tasks = getDb().tasks as TaskRow[]
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Task not found')
  tasks[idx] = { ...tasks[idx], ...patch } as TaskRow
  return asTask(tasks[idx])
}

export async function createTask(input: {
  title: string
  description?: string
  priority?: TaskPriority
  projectId?: number
  projectName?: string
  assigneeName?: string
  assigneeEmploymentId?: number | null
}): Promise<Task> {
  if (!env.useMockApi) {
    if (input.projectId == null) {
      throw new Error('projectId is required to create a task')
    }
    const { data } = await apiClient.post<Record<string, unknown>>('/projects/tasks', {
      project_id: input.projectId,
      title: input.title,
      description: input.description || null,
      priority: input.priority ?? 'MEDIUM',
      status: 'TODO',
      assignee_employment_id: input.assigneeEmploymentId ?? null,
    })
    const task = mapApiTask(data)
    if (input.assigneeName) task.assigneeName = input.assigneeName
    if (input.projectName) task.projectName = input.projectName
    return task
  }
  await delay(500)
  const db = getDb()
  const tasks = db.tasks as TaskRow[]
  const row: TaskRow = {
    id: nextId(tasks),
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'MEDIUM',
    status: 'TODO',
    projectId: input.projectId ?? 0,
    projectName: input.projectName ?? null,
    assigneeName: input.assigneeName ?? null,
    dueDate: null,
    createdAt: new Date().toISOString(),
  }
  tasks.unshift(row)

  if (input.projectId) {
    const pIdx = db.projects.findIndex((p) => p.id === input.projectId)
    if (pIdx !== -1) {
      db.projects[pIdx] = {
        ...db.projects[pIdx],
        taskCount: (db.projects[pIdx].taskCount ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      } as (typeof db.projects)[number]
    }
  }

  return asTask(row)
}
