export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'

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

const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: 'Implement AppShell layout',
    description: 'Icon rail + secondary sidebar + header',
    priority: 'HIGH',
    status: 'DONE',
    projectId: 1,
    projectName: 'Bytevon CRM Core',
    assigneeName: 'Virendra',
    dueDate: '2026-08-05',
    createdAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 2,
    title: 'Projects list & detail pages',
    description: 'List with mock data, detail, create form',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    projectId: 1,
    projectName: 'Bytevon CRM Core',
    assigneeName: 'Virendra',
    dueDate: '2026-08-10',
    createdAt: '2026-07-22T11:00:00Z',
  },
  {
    id: 3,
    title: 'Wire Teams module to API',
    description: 'Replace mock store with backend endpoints',
    priority: 'MEDIUM',
    status: 'TODO',
    projectId: 1,
    projectName: 'Bytevon CRM Core',
    assigneeName: undefined,
    dueDate: '2026-08-20',
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 4,
    title: 'Client portal auth flow',
    description: 'Login and session for external clients',
    priority: 'HIGH',
    status: 'TODO',
    projectId: 2,
    projectName: 'Client Portal',
    assigneeName: 'Design team',
    dueDate: '2026-09-15',
    createdAt: '2026-07-28T14:00:00Z',
  },
  {
    id: 5,
    title: 'Attendance check-in UI',
    description: 'Mobile-friendly mark attendance screen',
    priority: 'URGENT',
    status: 'BLOCKED',
    projectId: 3,
    projectName: 'Mobile Attendance',
    assigneeName: 'Mobile Ops',
    dueDate: '2026-06-01',
    createdAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 6,
    title: 'Design system tokens audit',
    description: 'Ensure all components use CSS variables',
    priority: 'LOW',
    status: 'IN_REVIEW',
    projectId: 1,
    projectName: 'Bytevon CRM Core',
    assigneeName: 'Beta Design',
    dueDate: '2026-08-12',
    createdAt: '2026-08-02T16:00:00Z',
  },
]

function delay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getTasks(params?: {
  search?: string
  status?: string
  projectId?: number
}): Promise<{ items: Task[]; total: number }> {
  await delay()
  let items = [...MOCK_TASKS]
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
  return MOCK_TASKS.find((t) => t.id === id) ?? null
}

export async function updateTask(
  id: number,
  patch: Partial<
    Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'assigneeName' | 'dueDate'>
  >
): Promise<Task> {
  await delay(400)
  const idx = MOCK_TASKS.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Task not found')
  MOCK_TASKS[idx] = { ...MOCK_TASKS[idx], ...patch }
  return MOCK_TASKS[idx]
}

export async function createTask(input: {
  title: string
  description?: string
  priority?: TaskPriority
  projectId?: number
  projectName?: string
}): Promise<Task> {
  await delay(500)
  const task: Task = {
    id: MOCK_TASKS.length + 1 + Math.floor(Math.random() * 1000),
    title: input.title,
    description: input.description,
    priority: input.priority ?? 'MEDIUM',
    status: 'TODO',
    projectId: input.projectId ?? 0,
    projectName: input.projectName,
    assigneeName: undefined,
    dueDate: null,
    createdAt: new Date().toISOString(),
  }
  MOCK_TASKS.unshift(task)
  return task
}
