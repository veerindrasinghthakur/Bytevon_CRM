/** Projects domain types — re-exported from zod schemas for a single module entrypoint */

export type {
  ProjectStatus,
  ProjectListItem,
  ProjectDetail,
  CreateProjectInput,
} from './schemas/project'

export interface ProjectDocument {
  id: string
  name: string
  type: string
  sizeLabel: string
  uploadedBy: string
  uploadedAt: string
  url?: string
}

export interface ProjectNote {
  id: string
  author: string
  body: string
  createdAt: string
  pinned?: boolean
}

export interface ProjectTaskListItem {
  id: number | string
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
