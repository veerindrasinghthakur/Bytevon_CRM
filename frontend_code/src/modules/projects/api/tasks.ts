export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'

export interface Task {
  id: number
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
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
}): Promise<{ items: Task[]; total: number }> {
  await delay()
  let items = [...MOCK_TASKS]
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

export async function createTask(input: {
  title: string
  description?: string
  priority?: TaskPriority
}): Promise<Task> {
  await delay(500)
  const task: Task = {
    id: MOCK_TASKS.length + 1 + Math.floor(Math.random() * 1000),
    title: input.title,
    description: input.description,
    priority: input.priority ?? 'MEDIUM',
    status: 'TODO',
    projectName: undefined,
    assigneeName: undefined,
    dueDate: null,
    createdAt: new Date().toISOString(),
  }
  MOCK_TASKS.unshift(task)
  return task
}
