/** Sales / CRM domain types — interfaces + schema re-exports */

import type {
  ActivityType,
  CaseStudyStatus,
  ClientType,
  LeadPriority,
  PipelineStage,
  RecordStatus,
} from './schemas/enums'

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
export type {
  ActivityType,
  CaseStudyStatus,
  ClientType,
  LeadPriority,
  PipelineStage,
  RecordStatus,
} from './schemas/enums'

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

export type LeadListParams = {
  search?: string
  status?: string
  stage?: string
  priority?: string
  source?: string
  page?: number
  pageSize?: number
}

export type ClientListParams = {
  search?: string
  status?: string
  type?: string
  page?: number
  pageSize?: number
}

export type CaseStudyListParams = {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export type LeadListData = { items: Lead[]; total: number; metrics: SalesMetric[] }
export type ClientListData = { items: Client[]; total: number; metrics: SalesMetric[] }

export interface LeadMetric {
  id: string
  label: string
  value: string
  icon: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
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

export interface LeadFilterOptions {
  statuses: string[]
  stages: string[]
  priorities: string[]
  sources: string[]
}

export interface ClientFilterOptions {
  statuses: string[]
  types: string[]
  industries: string[]
  countries: string[]
}

export interface SalesRepOption {
  employmentId: number
  name: string
  employeeCode: string
  department: string
}

import { delay} from '@/shared/mock/db'

