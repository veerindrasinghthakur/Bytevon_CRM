/**
 * Tasks API — env.useMockApi → shared mock DB; false → /projects/tasks or /tasks
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay, getDb, nextId } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import type { Task, TaskPriority } from '../types'

export type { Task, TaskPriority, TaskStatus } from '../types'

interface TaskRow {
  id: number
  title: string
  description?: string | null
  priority: string
  status: string
  projectId: number
  projectName?: string | null
  assigneeName?: string | null
  dueDate?: string | null
  createdAt: string
}

function asTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as TaskPriority,
    status: row.status,
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
    const { data } = await apiClient.get<{ items: Task[]; total: number }>('/projects/tasks', {
      params,
    })
    return data
  }
  await delay()
  let items = getDb().tasks.map(asTask)
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
      const { data } = await apiClient.get<Task>(`/projects/tasks/${id}`)
      return data
    } catch {
      return null
    }
  }
  await delay()
  const row = getDb().tasks.find((t) => t.id === id)
  return row ? asTask(row) : null
}

export async function updateTask(
  id: number,
  patch: Partial<
    Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'assigneeName' | 'dueDate'>
  >,
): Promise<Task> {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<Task>(`/projects/tasks/${id}`, patch)
    return data
  }
  await delay(400)
  const tasks = getDb().tasks
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Task not found')
  tasks[idx] = { ...tasks[idx], ...patch }
  return asTask(tasks[idx])
}

export async function createTask(input: {
  title: string
  description?: string
  priority?: TaskPriority
  projectId?: number
  projectName?: string
  assigneeName?: string
}): Promise<Task> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Task>('/projects/tasks', input)
    return data
  }
  await delay(500)
  const db = getDb()
  const tasks = db.tasks
  const row = {
    id: nextId(tasks),
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'MEDIUM',
    status: 'TODO',
    projectId: input.projectId ?? 0,
    projectName: input.projectName ?? null,
    assigneeName: input.assigneeName ?? null,
    dueDate: null as string | null,
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
      }
    }
  }

  return asTask(row)
}
