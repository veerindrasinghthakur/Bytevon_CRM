import { z } from 'zod'

export const RecordStatusValues = ['Active', 'Inactive'] as const
export type RecordStatus = (typeof RecordStatusValues)[number]

export const PipelineStageValues = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
  'Follow Up',
  'Closed',
] as const
export type PipelineStage = (typeof PipelineStageValues)[number]
export const PipelineStageOptions = PipelineStageValues.map((value) => ({ value, label: value }))

/**
 * Canonical backend LeadStatus codes → UI labels. Single source of truth
 * mirroring backend lead_ui._STATUS_TO_STAGE (EXECUTION_PLAN_SENT shares
 * the Proposal label; CLOSED reads as Closed, not Lost).
 */
export const LeadStageCodes = [
  'NEW',
  'CHAT_OPEN',
  'MEETING',
  'PROPOSAL_SENT',
  'EXECUTION_PLAN_SENT',
  'PAYMENT_DISCUSSION',
  'WON',
  'LOST',
  'FOLLOW_UP',
  'CLOSED',
] as const

export const LEAD_STAGE_LABEL: Record<string, string> = {
  NEW: 'New',
  CHAT_OPEN: 'Contacted',
  MEETING: 'Qualified',
  PROPOSAL_SENT: 'Proposal',
  EXECUTION_PLAN_SENT: 'Proposal',
  PAYMENT_DISCUSSION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
  FOLLOW_UP: 'Follow Up',
  CLOSED: 'Closed',
}

export function leadStageLabel(code: unknown): string {
  const key = String(code ?? '').toUpperCase().replace(/[\s-]+/g, '_')
  if (LEAD_STAGE_LABEL[key]) return LEAD_STAGE_LABEL[key]
  const title = String(code ?? '')
  return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()
}

/** UI label → backend code for server-side filtering (label wins on dupes). */
const STAGE_LABEL_TO_CODE: Record<string, string> = {
  New: 'NEW',
  Contacted: 'CHAT_OPEN',
  Qualified: 'MEETING',
  Proposal: 'PROPOSAL_SENT',
  Negotiation: 'PAYMENT_DISCUSSION',
  Won: 'WON',
  Lost: 'LOST',
  'Follow Up': 'FOLLOW_UP',
  Closed: 'CLOSED',
}

export function stageLabelToCode(label: unknown): string | undefined {
  const key = String(label ?? '')
  if (STAGE_LABEL_TO_CODE[key]) return STAGE_LABEL_TO_CODE[key]
  const upper = key.toUpperCase().replace(/[\s-]+/g, '_')
  return (LeadStageCodes as readonly string[]).includes(upper) ? upper : undefined
}

export const LeadPriorityValues = ['Critical', 'High', 'Medium', 'Low'] as const
export type LeadPriority = (typeof LeadPriorityValues)[number]
export const LeadPriorityOptions = LeadPriorityValues.map((value) => ({ value, label: value }))

export const ClientTypeValues = ['Enterprise', 'SMB', 'Partner', 'Individual'] as const
export type ClientType = (typeof ClientTypeValues)[number]
export const ClientTypeOptions = ClientTypeValues.map((value) => ({ value, label: value }))

export const CaseStudyStatusValues = ['Published', 'Draft', 'Archived'] as const
export type CaseStudyStatus = (typeof CaseStudyStatusValues)[number]

export const ActivityTypeValues = [
  'Lead Created',
  'Lead Won',
  'Meeting Scheduled',
  'Email Sent',
  'Call',
  'Document Viewed',
  'System Alert',
  'Contract Renewed',
  'Proposal Sent',
] as const
export type ActivityType = (typeof ActivityTypeValues)[number]

export const RecordStatusOptions = RecordStatusValues.map((value) => ({ value, label: value }))
export const CaseStudyStatusOptions = CaseStudyStatusValues.map((value) => ({ value, label: value }))

export const stageStyles: Record<string, string> = {
  New: 'status-badge status-info', Contacted: 'status-badge status-success', Qualified: 'status-badge status-warning',
  Proposal: 'status-badge status-info', Negotiation: 'status-badge status-warning', Won: 'status-badge status-success', Lost: 'status-badge status-error',
  'Follow Up': 'status-badge status-success', Closed: 'status-badge status-neutral',
}
export const stageDot: Record<string, string> = {
  New: 'bg-secondary', Contacted: 'bg-secondary', Qualified: 'bg-[var(--color-warning-amber)]', Proposal: 'bg-secondary',
  Negotiation: 'bg-[var(--color-warning-amber)]', Won: 'bg-secondary', Lost: 'bg-error',
  'Follow Up': 'bg-secondary', Closed: 'bg-outline',
}
export const priorityStyles: Record<string, string> = {
  Critical: 'status-badge status-error', High: 'status-badge status-error', Medium: 'status-badge status-warning', Low: 'status-badge status-neutral',
}
export const typeStyles: Record<string, string> = {
  Enterprise: 'status-badge status-info', SMB: 'status-badge status-success', Partner: 'status-badge status-neutral',
}
export const stageColors: Record<string, string> = {
  New: 'bg-secondary', Contacted: 'bg-secondary/80', Qualified: 'bg-[var(--color-warning-amber)]', Proposal: 'bg-primary',
  Negotiation: 'bg-primary/80', Won: 'bg-secondary', Lost: 'bg-error',
  'Follow Up': 'bg-secondary/60', Closed: 'bg-outline',
}
export const typeIcon: Record<ActivityType, string> = {
  'Lead Created': 'note_add', 'Lead Won': 'emoji_events', 'Meeting Scheduled': 'event', 'Email Sent': 'mail', Call: 'call',
  'Document Viewed': 'description', 'System Alert': 'warning', 'Contract Renewed': 'autorenew', 'Proposal Sent': 'send',
}
export const activityIcon: Record<string, string> = typeIcon
export const caseStudyStatusStyles: Record<string, string> = {
  Published: 'status-badge status-success', Draft: 'status-badge status-warning', Archived: 'status-badge status-neutral',
}
export const caseStudyStatusDot: Record<string, string> = {
  Published: 'bg-secondary', Draft: 'bg-[var(--color-warning-amber)]', Archived: 'bg-outline',
}
export const typeColor: Record<ActivityType, string> = {
  'Lead Created': 'bg-secondary/15 text-secondary', 'Lead Won': 'bg-secondary/15 text-secondary', 'Meeting Scheduled': 'bg-primary/15 text-primary',
  'Email Sent': 'bg-secondary/15 text-secondary', Call: 'bg-[var(--color-warning-amber)]/15 text-[var(--color-warning-amber)]',
  'Document Viewed': 'bg-surface-container text-on-surface-variant', 'System Alert': 'bg-error/15 text-error',
  'Contract Renewed': 'bg-secondary/15 text-secondary', 'Proposal Sent': 'bg-primary/15 text-primary',
}
export const changeTypeStyles: Record<string, string> = {
  positive: 'text-secondary bg-secondary/10', negative: 'text-error bg-error/10', neutral: 'text-on-surface-variant bg-surface-container',
}

/** Zod enums live here so entity/form files can import without circular TDZ. */
export const recordStatusSchema = z.enum(RecordStatusValues)
export const pipelineStageSchema = z.enum(PipelineStageValues)
export const leadPrioritySchema = z.enum(LeadPriorityValues)
export const clientTypeSchema = z.enum(ClientTypeValues)
export const caseStudyStatusSchema = z.enum(CaseStudyStatusValues)
export const activityTypeSchema = z.enum(ActivityTypeValues)
