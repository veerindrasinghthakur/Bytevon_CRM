/** Sales / CRM domain types */

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'
export type LeadPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ClientType = 'Enterprise' | 'SMB' | 'Partner'
export type ClientStatus = 'Active' | 'Pending' | 'Inactive' | 'At Risk'
export type CaseStudyStatus = 'Published' | 'Draft' | 'Archived'
export type ActivityType =
  | 'Lead Created'
  | 'Lead Won'
  | 'Meeting Scheduled'
  | 'Email Sent'
  | 'Call'
  | 'Document Viewed'
  | 'System Alert'
  | 'Contract Renewed'
  | 'Proposal Sent'

export interface Lead {
  id: string
  title: string
  contactName: string
  contactTitle?: string
  company: string
  industry?: string
  email?: string
  phone?: string
  source: string
  priority: LeadPriority
  status: LeadStatus
  budget: number
  probability?: number
  closeDate?: string
  assignedTo?: string
  assignedAvatar?: string
  platform?: string
  tags?: string[]
  caseStudy?: string
  createdAt: string
  notes?: string
}

export interface Client {
  id: string
  name: string
  legalName?: string
  type: ClientType
  status: ClientStatus
  industry: string
  sector?: string
  website?: string
  country: string
  email?: string
  phone?: string
  primaryContact?: string
  projects: number
  leads: number
  revenue?: number
  arr?: number
  growth?: string
  taxId?: string
  founded?: string
  address?: string
  clientSince?: string
  logoInitials?: string
  tags?: string[]
}

export interface CaseStudy {
  id: string
  title: string
  customer: string
  industry: string
  status: CaseStudyStatus
  impact: string
  revenue: string
  tags: string[]
  imageUrl?: string
  summary?: string
  technologies?: string[]
}

export interface SalesActivity {
  id: string
  type: ActivityType
  title: string
  body: string
  actor: string
  actorAvatar?: string
  time: string
  dateGroup: string
  linkLabel?: string
  linkHref?: string
  tag?: string
}

export interface SalesMetric {
  id: string
  label: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
  icon: string
}
