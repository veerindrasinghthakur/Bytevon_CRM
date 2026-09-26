/** Projects domain types — schemas + API entities */

import { z } from 'zod'
import type {
  ProjectStatus,
  ProjectListItem,
  ProjectDetail,
  CreateProjectInput,
  ProjectFormInput,
} from '../schemas/project/project'
import type { TaskPriority, TaskStatus, TeamStatus } from '../enums'
import {
  teamMemberFormSchema,
  teamMemberRoleSchema,
} from '../schemas/team/team-member-form'
import { createTaskSchema } from '../schemas/task/task-form'
import { createTeamSchema } from '../schemas/team/team-form'

export type {
  ProjectStatus,
  ProjectListItem,
  ProjectDetail,
  CreateProjectInput,
  ProjectFormInput,
} from '../schemas/project/project'

export type { TaskSchema, CreateTaskSchemaInput, TaskFormInput } from '../schemas/task/task'
export type { TeamSchema, CreateTeamSchemaInput, TeamFormInput } from '../schemas/team/team'
export type { ProjectNoteSchema, NoteFormInput } from '../schemas/note/note'
export { teamMembersMock } from '../data/teamMembersMock'
export type { TeamMemberMock } from '../data/teamMembersMock'
export type { FormValues } from '../schemas/team/team-form'

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>
export type TeamMemberRole = z.infer<typeof teamMemberRoleSchema>

/** Re-export enum types from single source */
export type { TaskPriority, TaskStatus, TeamStatus } from '../enums'

/** Tabs for project detail page. */
export type ProjectDetailTab = 'overview' | 'tasks' | 'documents' | 'notes'

/** Parameters for filtering and paginating project lists. */
export type ProjectListParams = {
  search?: string
  status?: string
  teamId?: number
  page?: number
  pageSize?: number
  dateFrom?: string
  dateTo?: string
  /** Data-boundary hint; backend enforces from auth token. */
  scope?: string
}

/** Cached project list response structure. */
export interface ProjectListCache {
  items: ProjectListItem[]
  total: number
  metrics?: ProjectListMetrics
}

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
  assigneeEmploymentId?: number | null
  startDate?: string | null
  dueDate?: string | null
  estimatedHours?: number | null
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
  projectName?: string
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
  startDate?: string | null
  dueDate?: string | null
  createdAt: string
}


export interface TeamMemberRow {
  id?: string | number
  employmentId?: number
  name: string
  code?: string
  title?: string
  role: string
  email?: string
  department?: string
  status?: 'Active' | 'On Leave' | string
  joined?: string
  leftDate?: string
  isHead?: boolean
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

export interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  projectId?: number
  projectName?: string
  onCreated?: () => void
}

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>
export type CreateTeamFormValues = z.infer<typeof createTeamSchema>

export interface CreateTeamModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

import { ProjectPhaseOptions, ProjectPriorityOptions } from '../enums'

export type AssignMode = 'existing' | 'new' | 'later' | 'Individual'
export type PhaseValue = (typeof ProjectPhaseOptions)[number]['value']
export type PriorityValue = (typeof ProjectPriorityOptions)[number]['value']

export interface ProjectQuickContentProps {
  clientName?: string | null
  progress?: number | null
  taskCount?: number | null
  teamCount?: number | null
  startDate?: string | null
  endDate?: string | null
}

