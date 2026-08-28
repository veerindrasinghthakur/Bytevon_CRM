import type { ActivityType } from './enums'

export const stageStyles = {
  New: 'bg-blue-100 text-blue-800',
  Contacted: 'bg-green-100 text-green-800',
  Qualified: 'bg-yellow-100 text-yellow-800',
  Proposal: 'bg-purple-100 text-purple-800',
  Negotiation: 'bg-orange-100 text-orange-800',
  Won: 'bg-green-600 text-white',
  Lost: 'bg-red-600 text-white',
}

export const priorityStyles = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-blue-100 text-blue-800',
}

export const typeStyles = {
  Enterprise: 'bg-blue-100 text-blue-800',
  SMB: 'bg-green-100 text-green-800',
  Partner: 'bg-purple-100 text-purple-800',
}

export const stageColors = {
  New: 'from-blue-500 to-blue-400',
  Contacted: 'from-green-500 to-green-400',
  Qualified: 'from-yellow-500 to-yellow-400',
  Proposal: 'from-purple-500 to-purple-400',
  Negotiation: 'from-orange-500 to-orange-400',
  Won: 'from-green-600 to-green-500',
  Lost: 'from-red-600 to-red-500',
}

export const typeIcon: Record<
  ActivityType,
  string
> = {
  'Lead Created': '📝',
  'Lead Won': '🏆',
  'Meeting Scheduled': '📅',
  'Email Sent': '📧',
  Call: '📞',
  'Document Viewed': '📄',
  'System Alert': '⚠️',
  'Contract Renewed': '🔄',
  'Proposal Sent': '📋',
}

export const caseStudyStatusStyles: Record<string, string> = {
  Published: 'status-badge status-success',
  Draft: 'status-badge status-warning',
  Archived: 'status-badge status-neutral',
}

export const caseStudyStatusDot: Record<string, string> = {
  Published: 'bg-emerald-500',
  Draft: 'bg-amber-500',
  Archived: 'bg-slate-400',
}