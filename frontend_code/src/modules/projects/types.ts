/** Projects domain types — schemas + API entities */

export type {
  ProjectStatus,
  ProjectListItem,
  ProjectDetail,
  CreateProjectInput,
  ProjectFormInput,
} from './schemas/project'

export type { TaskSchema, CreateTaskSchemaInput, TaskFormInput } from './schemas/task'
export type { TeamSchema, CreateTeamSchemaInput, TeamFormInput } from './schemas/team'
export type { ProjectNoteSchema, NoteFormInput } from './schemas/note'

/** Task API priority / status (uppercase enum style) */
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

export type TeamStatus = 'ACTIVE' | 'INACTIVE'

export interface Team {
  id: number
  name: string
  description?: string
  department?: string
  headName?: string
  headRole?: string
  projectName?: string
  memberCount: number
  projectCount: number
  status: TeamStatus
  createdAt: string
}

export interface TaskListCache {
  items: Task[]
  total: number
}

export interface TeamListCache {
  items: Team[]
  total: number
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  projectId?: number
  projectName?: string
  assigneeName?: string
}

export interface CreateTeamInput {
  name: string
  description?: string
  headName?: string
  headRole?: string
  memberNames?: string[]
  projectId?: number
  projectName?: string
}

export interface ProjectDocument {
  id: string
  name: string
  type: string
  sizeLabel: string
  uploadedBy: string
  uploadedAt: string
  url?: string
  referenceType?: string
  referenceId?: number
}

export interface ProjectNote {
  id: string
  author: string
  body: string
  createdAt: string
  pinned?: boolean
}

export interface ProjectTaskListItem {
  id: number
  title: string
  status: string
  priority?: string
  assigneeName?: string
  dueDate?: string | null
  projectId?: number
}

export interface ProjectTeamListItem {
  id: string
  name: string
  memberCount?: number
  leadName?: string
}
