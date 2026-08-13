import { delay, getDb, nextId } from '@/shared/mock/db'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' | 'ON_HOLD'

/** Tasks are sub-parts of a project (always owned by projectId). */
export interface Task {
  id: number
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  projectId: number
  projectName?: string
  assigneeName?: string
  dueDate?: string | null
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asTask(row: any): Task {
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
}): Promise<{ items: Task[]; total: number }> {
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
        t.assigneeName?.toLowerCase().includes(q)
    )
  }
  if (params?.status) {
    items = items.filter((t) => t.status === params.status)
  }
  return { items, total: items.length }
}

export async function getTask(id: number): Promise<Task | null> {
  await delay()
  const row = getDb().tasks.find((t) => t.id === id)
  return row ? asTask(row) : null
}

export async function updateTask(
  id: number,
  patch: Partial<
    Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'assigneeName' | 'dueDate'>
  >
): Promise<Task> {
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
