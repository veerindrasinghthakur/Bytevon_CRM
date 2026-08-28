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

export const LeadPriorityValues = ['Critical', 'High', 'Medium', 'Low'] as const
export type LeadPriority = (typeof LeadPriorityValues)[number]

export const ClientTypeValues = ['Enterprise', 'SMB', 'Partner'] as const
export type ClientType = (typeof ClientTypeValues)[number]

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
