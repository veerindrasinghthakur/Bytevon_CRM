export const ProjectStatus = [
  'PLANNING',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const

export type ProjectStatus = (typeof ProjectStatus)[number]

export const TaskPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type TaskPriority = (typeof TaskPriority)[number]

export const TaskStatus = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED',
  'ON_HOLD',
] as const
export type TaskStatus = (typeof TaskStatus)[number]

export const TeamStatus = ['ACTIVE', 'INACTIVE'] as const
export type TeamStatus = (typeof TeamStatus)[number]

export const ProjectPhase = ['DISCOVERY', 'PLANNING', 'IMPLEMENTATION', 'QA_TESTING', 'DEPLOYMENT', 'MAINTENANCE'] as const
export type ProjectPhase = (typeof ProjectPhase)[number]

export const ProjectPriority = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type ProjectPriority = (typeof ProjectPriority)[number]

export const ProjectStatusOptions = ProjectStatus.map((value) => ({
  value,
  label: value.replace('_', ' '),
}))

export const TaskStatusOptions = TaskStatus.map((value) => ({
  value,
  label: value.replace('_', ' '),
}))

export const TaskPriorityOptions = TaskPriority.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}))

export const TeamStatusOptions = TeamStatus.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}))

export const ProjectPhaseOptions = ProjectPhase.map((value) => ({
  value,
  label: value.replace('_', ' '),
}))

export const ProjectPriorityOptions = ProjectPriority.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}))

/** Task priority options with formatted labels (TaskDetailForm). */
export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
] as const

/** Task status options with formatted labels (TaskDetailForm). */
export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'DONE', label: 'Done' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'ON_HOLD', label: 'On hold' },
] as const

/** Task status filter options for project detail views. */
export const TaskStatusFilterOptions = [
  { value: '', label: 'All statuses' },
  ...TASK_STATUS_OPTIONS,
] as const
