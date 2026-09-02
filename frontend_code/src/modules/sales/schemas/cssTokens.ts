import type { ActivityType } from './enums'

/** Pipeline stage pills — semantic status-badge tokens only */
export const stageStyles: Record<string, string> = {
  New: 'status-badge status-info',
  Contacted: 'status-badge status-success',
  Qualified: 'status-badge status-warning',
  Proposal: 'status-badge status-info',
  Negotiation: 'status-badge status-warning',
  Won: 'status-badge status-success',
  Lost: 'status-badge status-error',
}

export const stageDot: Record<string, string> = {
  New: 'bg-secondary',
  Contacted: 'bg-secondary',
  Qualified: 'bg-[var(--color-warning-amber)]',
  Proposal: 'bg-secondary',
  Negotiation: 'bg-[var(--color-warning-amber)]',
  Won: 'bg-secondary',
  Lost: 'bg-error',
}

export const priorityStyles: Record<string, string> = {
  Critical: 'status-badge status-error',
  High: 'status-badge status-error',
  Medium: 'status-badge status-warning',
  Low: 'status-badge status-neutral',
}

export const typeStyles: Record<string, string> = {
  Enterprise: 'status-badge status-info',
  SMB: 'status-badge status-success',
  Partner: 'status-badge status-neutral',
}

/** Funnel bar colors (solid utility on secondary / error scale) */
export const stageColors: Record<string, string> = {
  New: 'bg-secondary',
  Contacted: 'bg-secondary/80',
  Qualified: 'bg-[var(--color-warning-amber)]',
  Proposal: 'bg-primary',
  Negotiation: 'bg-primary/80',
  Won: 'bg-secondary',
  Lost: 'bg-error',
}

export const typeIcon: Record<ActivityType, string> = {
  'Lead Created': 'note_add',
  'Lead Won': 'emoji_events',
  'Meeting Scheduled': 'event',
  'Email Sent': 'mail',
  Call: 'call',
  'Document Viewed': 'description',
  'System Alert': 'warning',
  'Contract Renewed': 'autorenew',
  'Proposal Sent': 'send',
}

/** Alias used by LeadDetail / SalesActivityTimeline */
export const activityIcon: Record<string, string> = typeIcon

export const caseStudyStatusStyles: Record<string, string> = {
  Published: 'status-badge status-success',
  Draft: 'status-badge status-warning',
  Archived: 'status-badge status-neutral',
}

export const caseStudyStatusDot: Record<string, string> = {
  Published: 'bg-secondary',
  Draft: 'bg-[var(--color-warning-amber)]',
  Archived: 'bg-outline',
}

export const typeColor: Record<ActivityType, string> = {
  'Lead Created': 'bg-secondary/15 text-secondary',
  'Lead Won': 'bg-secondary/15 text-secondary',
  'Meeting Scheduled': 'bg-primary/15 text-primary',
  'Email Sent': 'bg-secondary/15 text-secondary',
  Call: 'bg-[var(--color-warning-amber)]/15 text-[var(--color-warning-amber)]',
  'Document Viewed': 'bg-surface-container text-on-surface-variant',
  'System Alert': 'bg-error/15 text-error',
  'Contract Renewed': 'bg-secondary/15 text-secondary',
  'Proposal Sent': 'bg-primary/15 text-primary',
}

/** Metric delta chips */
export const changeTypeStyles: Record<string, string> = {
  positive: 'text-secondary bg-secondary/10',
  negative: 'text-error bg-error/10',
  neutral: 'text-on-surface-variant bg-surface-container',
}
