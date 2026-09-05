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
] as const
export type PipelineStage = (typeof PipelineStageValues)[number]
export const PipelineStageOptions = PipelineStageValues.map((value) => ({ value, label: value }))

export const LeadPriorityValues = ['Critical', 'High', 'Medium', 'Low'] as const
export type LeadPriority = (typeof LeadPriorityValues)[number]
export const LeadPriorityOptions = LeadPriorityValues.map((value) => ({ value, label: value }))

export const ClientTypeValues = ['Enterprise', 'SMB', 'Partner'] as const
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
}
export const stageDot: Record<string, string> = {
  New: 'bg-secondary', Contacted: 'bg-secondary', Qualified: 'bg-[var(--color-warning-amber)]', Proposal: 'bg-secondary',
  Negotiation: 'bg-[var(--color-warning-amber)]', Won: 'bg-secondary', Lost: 'bg-error',
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
