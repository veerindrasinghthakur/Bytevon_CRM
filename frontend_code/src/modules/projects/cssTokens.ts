import type { ProjectStatus, TaskStatus, TaskPriority, TeamStatus } from './enums'

export const projectStatusColors: Record<
  ProjectStatus,
  { dot: string; text: string; label: string; badge: string }
> = {
  PLANNING: {
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    label: 'Planning',
    badge: 'bg-surface-container-high text-on-surface-variant',
  },
  IN_PROGRESS: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    label: 'On Track',
    badge: 'bg-electric-blue/10 text-electric-blue',
  },
  ON_HOLD: {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    label: 'Delayed',
    badge: 'bg-amber-100 text-amber-800',
  },
  COMPLETED: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    label: 'Completed',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  CANCELLED: {
    dot: 'bg-gray-400',
    text: 'text-on-surface-variant',
    label: 'Cancelled',
    badge: 'bg-error/10 text-error',
  },
}

export const taskStatusColors: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  TODO: { label: 'To Do', className: 'bg-surface-container-high text-on-surface-variant' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-electric-blue/10 text-electric-blue' },
  IN_REVIEW: { label: 'In Review', className: 'bg-violet-100 text-violet-800' },
  DONE: { label: 'Done', className: 'bg-emerald-100 text-emerald-800' },
  BLOCKED: { label: 'Blocked', className: 'bg-error/10 text-error' },
  ON_HOLD: { label: 'On Hold', className: 'bg-amber-100 text-amber-800' },
}

export const taskPriorityColors: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: { label: 'Low', className: 'text-on-surface-variant' },
  MEDIUM: { label: 'Medium', className: 'text-on-surface' },
  HIGH: { label: 'High', className: 'text-amber-700' },
  URGENT: { label: 'Urgent', className: 'text-error font-semibold' },
}

export const teamStatusColors: Record<
  TeamStatus,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: { label: 'Active', className: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  INACTIVE: { label: 'Inactive', className: 'bg-slate-100 text-slate-800', dot: 'bg-slate-400' },
}

export const FALLBACK_STATUS = { label: 'Unknown', className: 'bg-surface-container text-on-surface-variant' }
export const FALLBACK_PRIORITY = { label: '—', className: 'text-on-surface-variant' }