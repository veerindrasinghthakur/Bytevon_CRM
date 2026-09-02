import type { ProjectStatus, TaskStatus, TaskPriority, TeamStatus } from './enums'

/** Semantic status tokens only — no raw Tailwind palette colors. */

export const projectStatusColors: Record<
  ProjectStatus,
  { dot: string; text: string; label: string; badge: string }
> = {
  PLANNING: {
    dot: 'bg-secondary',
    text: 'text-secondary',
    label: 'Planning',
    badge: 'status-badge status-neutral',
  },
  IN_PROGRESS: {
    dot: 'bg-secondary',
    text: 'text-secondary',
    label: 'On Track',
    badge: 'status-badge status-info',
  },
  ON_HOLD: {
    dot: 'bg-[var(--color-warning-amber)]',
    text: 'text-[var(--color-warning-amber)]',
    label: 'Delayed',
    badge: 'status-badge status-warning',
  },
  COMPLETED: {
    dot: 'bg-secondary',
    text: 'text-secondary',
    label: 'Completed',
    badge: 'status-badge status-success',
  },
  CANCELLED: {
    dot: 'bg-outline',
    text: 'text-on-surface-variant',
    label: 'Cancelled',
    badge: 'status-badge status-error',
  },
}

export const taskStatusColors: Record<TaskStatus, { label: string; className: string; dot: string }> = {
  TODO: { label: 'To Do', className: 'status-badge status-neutral', dot: 'bg-outline' },
  IN_PROGRESS: { label: 'In Progress', className: 'status-badge status-info', dot: 'bg-secondary' },
  IN_REVIEW: { label: 'In Review', className: 'status-badge status-warning', dot: 'bg-[var(--color-warning-amber)]' },
  DONE: { label: 'Done', className: 'status-badge status-success', dot: 'bg-secondary' },
  BLOCKED: { label: 'Blocked', className: 'status-badge status-error', dot: 'bg-error' },
  ON_HOLD: { label: 'On Hold', className: 'status-badge status-warning', dot: 'bg-[var(--color-warning-amber)]' },
}

export const taskPriorityColors: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'text-on-surface-variant' },
  MEDIUM: { label: 'Medium', className: 'text-on-surface' },
  HIGH: { label: 'High', className: 'text-[var(--color-warning-amber)]' },
  URGENT: { label: 'Urgent', className: 'text-error font-semibold' },
}

export const teamStatusColors: Record<
  TeamStatus,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: { label: 'Active', className: 'status-badge status-success', dot: 'bg-secondary' },
  INACTIVE: { label: 'Inactive', className: 'status-badge status-neutral', dot: 'bg-outline' },
}

export const FALLBACK_STATUS = {
  label: 'Unknown',
  className: 'status-badge status-neutral',
  dot: 'bg-outline',
}
export const FALLBACK_PRIORITY = { label: '—', className: 'text-on-surface-variant' }
