/**
 * Tasks API — shared by Tasks list + Project detail Tasks tab.
 * Backend TaskStatus: TODO | IN_PROGRESS | IN_REVIEW | COMPLETED | BLOCKED | CANCELLED
 * Backend TaskPriority: LOW | MEDIUM | HIGH | CRITICAL
 * UI uses DONE / URGENT labels; mapped at the API boundary.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type { Task, TaskPriority, TaskStatus, TaskRow } from '../types'

export type { Task, TaskPriority, TaskStatus } from '../types'

/** UI status → backend status */
function toBackendStatus(status: string | undefined | null): string | undefined {
  if (status == null || status === '') return undefined
  const s = String(status).toUpperCase()
  if (s === 'DONE') return 'COMPLETED'
  if (s === 'ON_HOLD') return 'BLOCKED'
  return s
}

/** Backend status → UI status */
function fromBackendStatus(status: string | undefined | null): TaskStatus {
  const s = String(status ?? 'TODO').toUpperCase()
  const map: Record<string, TaskStatus> = {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    IN_REVIEW: 'IN_REVIEW',
    COMPLETED: 'DONE',
    DONE: 'DONE',
    BLOCKED: 'BLOCKED',
    CANCELLED: 'BLOCKED',
    ON_HOLD: 'ON_HOLD',
  }
  return map[s] ?? 'TODO'
}

function toBackendPriority(priority: string | undefined | null): string | undefined {
  if (priority == null || priority === '') return undefined
  const p = String(priority).toUpperCase()
  if (p === 'URGENT') return 'CRITICAL'
  return p
}

function fromBackendPriority(priority: string | undefined | null): TaskPriority {
  const p = String(priority ?? 'MEDIUM').toUpperCase()
  if (p === 'CRITICAL') return 'URGENT'
  if (p === 'LOW' || p === 'MEDIUM' || p === 'HIGH' || p === 'URGENT') return p as TaskPriority
  return 'MEDIUM'
}

function resolveEmploymentName(employmentId: number | null | undefined): string | undefined {
  if (employmentId == null || !Number.isFinite(Number(employmentId))) return undefined
  const id = Number(employmentId)
  try {
    const db = getDb()
    const emp = db.employments?.find((e) => e.id === id)
    if (!emp) return undefined
    const person = db.persons?.find((p) => p.id === emp.person_id)
    if (person) {
      const name = `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim()
      if (name) return name
    }
    return emp.employee_code
  } catch {
    return undefined
  }
}

function mapApiTask(row: Record<string, unknown>): Task {
  const assigneeIdRaw = row.assignee_employment_id ?? row.assigneeEmploymentId
  const assigneeEmploymentId =
    assigneeIdRaw != null && Number.isFinite(Number(assigneeIdRaw)) ? Number(assigneeIdRaw) : null
  let assigneeName =
    (row.assignee_name as string | undefined) ??
    (row.assigneeName as string | undefined) ??
    undefined
  if (!assigneeName && assigneeEmploymentId != null) {
    assigneeName = resolveEmploymentName(assigneeEmploymentId)
  }
  const nestedAssignee = row.assignee
  if (!assigneeName && nestedAssignee && typeof nestedAssignee === 'object') {
    const a = nestedAssignee as Record<string, unknown>
    const n = a.name ?? a.full_name ?? a.fullName
    if (n != null) assigneeName = String(n)
  }
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    description: (row.description as string | undefined) ?? undefined,
    priority: fromBackendPriority(String(row.priority ?? 'MEDIUM')),
    status: fromBackendStatus(String(row.status ?? 'TODO')),
    projectId: Number(row.project_id ?? row.projectId ?? 0),
    projectName:
      (row.project_name as string | undefined) ??
      (row.projectName as string | undefined) ??
      undefined,
    assigneeName: assigneeName || undefined,
    assigneeEmploymentId,
    startDate: (row.start_date as string | null | undefined) ?? (row.startDate as string | null) ?? null,
    dueDate: (row.due_date as string | null | undefined) ?? (row.dueDate as string | null) ?? null,
    estimatedHours:
      row.estimated_hours != null && Number.isFinite(Number(row.estimated_hours))
        ? Number(row.estimated_hours)
        : ((row.estimatedHours as number | null | undefined) ?? null),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  }
}

function asTask(row: TaskRow): Task {
  const employmentId =
    (row as TaskRow & { assigneeEmploymentId?: number | null }).assigneeEmploymentId ?? null
  const resolvedName =
    row.assigneeName ??
    (employmentId != null ? resolveEmploymentName(employmentId) : undefined) ??
    undefined
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    projectId: row.projectId,
    projectName: row.projectName ?? undefined,
    assigneeName: resolvedName || undefined,
    assigneeEmploymentId: employmentId,
    startDate: row.startDate ?? null,
    dueDate: row.dueDate ?? null,
    createdAt: row.createdAt,
  }
}

export async function getTasks(params?: {
  search?: string
  status?: string
  projectId?: number
  projectName?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Task[]; total: number }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      { items: Task[]; total: number } | Array<Record<string, unknown>>
    >('/projects/tasks', {
      params: {
        project_id: params?.projectId,
        project_name: params?.projectName || undefined,
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
  if (params?.projectName) {
    const q = params.projectName.toLowerCase()
    items = items.filter((t) => (t.projectName ?? '').toLowerCase().includes(q))
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
    if (patch.priority != null) body.priority = toBackendPriority(patch.priority)
    if (patch.status != null) body.status = toBackendStatus(patch.status)
    if (patch.dueDate !== undefined) body.due_date = patch.dueDate || null
    if (patch.assigneeEmploymentId !== undefined)
      body.assignee_employment_id = patch.assigneeEmploymentId
    const { data } = await apiClient.patch<Record<string, unknown>>(`/projects/tasks/${id}`, body)
    const mapped = mapApiTask(data)
    if (patch.assigneeName && !mapped.assigneeName) {
      mapped.assigneeName = patch.assigneeName
    }
    if (patch.assigneeEmploymentId !== undefined && mapped.assigneeEmploymentId == null) {
      mapped.assigneeEmploymentId = patch.assigneeEmploymentId
    }
    return mapped
  }
  await delay(400)
  const tasks = getDb().tasks as Array<TaskRow & { assigneeEmploymentId?: number | null }>
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Task not found')
  const prev = tasks[idx]
  const nextEmployment =
    patch.assigneeEmploymentId !== undefined ? patch.assigneeEmploymentId : prev.assigneeEmploymentId
  let nextName = patch.assigneeName !== undefined ? patch.assigneeName : prev.assigneeName
  if (patch.assigneeEmploymentId !== undefined) {
    nextName =
      patch.assigneeName ??
      resolveEmploymentName(patch.assigneeEmploymentId) ??
      (patch.assigneeEmploymentId == null ? null : prev.assigneeName)
  }
  tasks[idx] = {
    ...prev,
    ...patch,
    assigneeEmploymentId: nextEmployment ?? null,
    assigneeName: nextName ?? null,
  } as TaskRow & { assigneeEmploymentId?: number | null }
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
  startDate?: string
  dueDate?: string
  estimatedHours?: number
}): Promise<Task> {
  if (!env.useMockApi) {
    if (input.projectId == null) {
      throw new Error('projectId is required to create a task')
    }
    const { data } = await apiClient.post<Record<string, unknown>>('/projects/tasks', {
      project_id: input.projectId,
      title: input.title,
      description: input.description || null,
      priority: toBackendPriority(input.priority ?? 'MEDIUM'),
      status: 'TODO',
      assignee_employment_id: input.assigneeEmploymentId ?? null,
      start_date: input.startDate || null,
      due_date: input.dueDate || null,
      estimated_hours:
        input.estimatedHours != null && Number.isFinite(input.estimatedHours)
          ? input.estimatedHours
          : null,
    })
    const task = mapApiTask(data)
    if (input.assigneeName) task.assigneeName = input.assigneeName
    if (input.projectName) task.projectName = input.projectName
    if (input.assigneeEmploymentId != null && task.assigneeEmploymentId == null) {
      task.assigneeEmploymentId = input.assigneeEmploymentId
    }
    return task
  }
  await delay(500)
  const db = getDb()
  const tasks = db.tasks as Array<TaskRow & { assigneeEmploymentId?: number | null }>
  const resolvedName =
    input.assigneeName ??
    (input.assigneeEmploymentId != null
      ? resolveEmploymentName(input.assigneeEmploymentId)
      : undefined) ??
    null
  const row: TaskRow & { assigneeEmploymentId?: number | null } = {
    id: nextId(tasks),
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'MEDIUM',
    status: 'TODO',
    projectId: input.projectId ?? 0,
    projectName: input.projectName ?? null,
    assigneeName: resolvedName,
    assigneeEmploymentId: input.assigneeEmploymentId ?? null,
    dueDate: input.dueDate ?? null,
    startDate: input.startDate ?? null,
    createdAt: new Date().toISOString(),
  }
  tasks.unshift(row)
  return asTask(row)
}
