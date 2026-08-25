/** Sales / CRM domain types — interfaces + schema re-exports */

export type {
  LeadSchema,
  CreateLeadSchemaInput,
  LeadFormSchemaInput,
} from './schemas/lead'
export type {
  ClientSchema,
  CreateClientSchemaInput,
  ClientFormSchemaInput,
} from './schemas/client'
export type { CaseStudySchema, CaseStudyFormInput } from './schemas/case-study'

/** Simple account/lead active state — shown as colored dots */
export type RecordStatus = 'Active' | 'Inactive'

/** Pipeline / lifecycle stage — separate from priority and Active/Inactive */
export type PipelineStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost'

export type LeadPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ClientType = 'Enterprise' | 'SMB' | 'Partner'
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
  /** Active | Inactive — colored dot */
  status: RecordStatus
  /** Pipeline stage — separate column from priority & status */
  stage: PipelineStage
  budget: number
  probability?: number
  /** Displayed as "Date" in tables */
  date?: string
  assignedTo?: string
  assignedAvatar?: string
  platform?: string
  tags?: string[]
  caseStudy?: string
  createdAt: string
  notes?: string
  /** Link to chat conversation with the client */
  chatLink?: string
}

export interface Client {
  id: string
  name: string
  legalName?: string
  type: ClientType
  /** Active | Inactive */
  status: RecordStatus
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
  chatLink?: string
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

/** Create / update payloads (API) */
export interface CreateLeadInput {
  title: string
  company: string
  contactName: string
  contactTitle?: string
  industry?: string
  email?: string
  phone?: string
  source?: string
  priority?: LeadPriority
  status?: RecordStatus
  stage?: PipelineStage
  budget?: number
  date?: string
  assignedTo?: string
  assignedEmploymentId?: number | null
  notes?: string
  chatLink?: string
}

export type UpdateLeadInput = Partial<CreateLeadInput>

export interface ClientContactForm {
  id: string
  name: string
  designation: string
  email: string
  phone: string
}

export interface CreateClientInput {
  name: string
  legalName?: string
  type?: ClientType
  status?: RecordStatus
  industry?: string
  website?: string
  country?: string
  address?: string
  taxId?: string
  founded?: string
  chatLink?: string
  primaryContact?: string
  email?: string
  phone?: string
}

export type UpdateClientInput = Partial<CreateClientInput>

/**
 * Form state shapes (UI) — string fields for inputs; map to Create*Input on submit.
 * Prefer these over scattered useState per field.
 */
export interface LeadForm {
  title: string
  contactName: string
  contactTitle: string
  company: string
  industry: string
  email: string
  phone: string
  source: string
  priority: LeadPriority
  status: RecordStatus
  stage: PipelineStage
  /** String so empty input stays controlled; parse to number on submit */
  budget: string
  date: string
  /** Employment id as string for Select; parse on submit */
  assignedEmploymentId: string
  notes: string
  chatLink: string
}

export const emptyLeadForm = (): LeadForm => ({
  title: '',
  contactName: '',
  contactTitle: '',
  company: '',
  industry: '',
  email: '',
  phone: '',
  source: 'LinkedIn',
  priority: 'Medium',
  status: 'Active',
  stage: 'New',
  budget: '',
  date: '',
  assignedEmploymentId: '',
  notes: '',
  chatLink: '',
})

export interface ClientForm {
  name: string
  legalName: string
  type: ClientType
  status: RecordStatus
  industry: string
  website: string
  country: string
  state: string
  city: string
  address: string
  taxId: string
  founded: string
  chatLink: string
  contacts: ClientContactForm[]
}

export function emptyClientContact(): ClientContactForm {
  return {
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    designation: '',
    email: '',
    phone: '',
  }
}

export const emptyClientForm = (): ClientForm => ({
  name: '',
  legalName: '',
  type: 'SMB',
  status: 'Active',
  industry: '',
  website: '',
  country: '',
  state: '',
  city: '',
  address: '',
  taxId: '',
  founded: '',
  chatLink: '',
  contacts: [emptyClientContact()],
})
