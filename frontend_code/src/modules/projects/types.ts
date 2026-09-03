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

/** Re-export enum types from single source */
export type { TaskPriority, TaskStatus, TeamStatus } from './enums'

import type { TaskPriority, TaskStatus, TeamStatus } from './enums'

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

import { computeProjectListMetrics } from '@/shared/compute/project-metrics'

export type ProjectListMetrics = ReturnType<typeof computeProjectListMetrics>

export interface TaskRow {
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


export interface TeamMemberRow {
  id: string
  name: string
  title: string
  role: string
  email: string
  status: 'Active' | 'On Leave'
  joined: string
}

export interface TeamProjectRow {
  id: number
  name: string
  client: string
  status: 'Active' | 'Completed' | 'On Hold'
  due: string
  pct: number
  role: string
}

export interface TeamCandidate {
  id: string
  name: string
  department: string
  years: number
  availability: 'Available' | 'Busy'
}

export interface TeamRow {
  id: number
  name: string
  description?: string | null
  department?: string | null
  headName?: string | null
  headRole?: string | null
  projectName?: string | null
  memberCount: number
  projectCount: number
  status: string
  createdAt: string
}
export type EmployeeLike = {
  id: number | string
  fullName: string
  role?: string | null
  email?: string | null
  status?: string | null
  joiningDate?: string | null
  department?: string | null
}

