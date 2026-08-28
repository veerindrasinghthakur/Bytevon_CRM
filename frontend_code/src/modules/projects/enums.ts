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