/**
 * Lead domain API — list/detail/create/update/stage + filter options + sales reps + platforms.
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import { leadStageLabel, stageLabelToCode } from '../schemas/enums'
import { leads as seedLeads, salesMetrics } from '../data/mock'
import type {
  Lead,
  SalesMetric,
  CreateLeadInput,
  SalesRepOption,
  LeadFilterOptions,
  PlatformOption,
  PipelineStage,
} from '../types'

let leadsStore: Lead[] | null = null

const MOCK_PLATFORMS: PlatformOption[] = [
  { id: 1, name: 'LinkedIn', description: null },
  { id: 2, name: 'Website', description: null },
  { id: 3, name: 'Referral', description: null },
  { id: 4, name: 'Direct Referral', description: null },
  { id: 5, name: 'Event', description: null },
  { id: 6, name: 'Other', description: null },
  { id: 7, name: 'Manual', description: null },
]

function leads(): Lead[] {
  if (!leadsStore) leadsStore = seedLeads.map((l) => ({ ...l }))
  return leadsStore
}

/** Map FastAPI LeadResponse (snake or mixed) → UI Lead. */
function mapApiLead(row: Record<string, unknown>): Lead {
  const id = String(row.id ?? '')
  const contactName = String(
    row.contactName ?? row.contact_name ?? row.title ?? row.lead_title ?? '—',
  )
  const stageRaw = String(row.stage ?? row.status ?? 'New')
  const stageKey = stageRaw.toUpperCase().replace(/\s+/g, '_')
  // Canonical backend-driven mapping (mirrors backend lead_ui._STATUS_TO_STAGE).
  const knownStages: Lead['stage'][] = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost',
    'Follow Up',
    'Closed',
  ]
  const mappedLabel = leadStageLabel(stageKey)
  const stage: Lead['stage'] = (knownStages as string[]).includes(mappedLabel)
    ? (mappedLabel as Lead['stage'])
    : (knownStages as string[]).includes(stageRaw)
      ? (stageRaw as Lead['stage'])
      : 'New'
  const statusRaw = String(row.recordStatus ?? row.record_status ?? row.status ?? 'Active')
  const status: Lead['status'] =
    statusRaw.toUpperCase() === 'INACTIVE' ||
    statusRaw === 'Inactive' ||
    stage === 'Won' ||
    stage === 'Lost' ||
    stage === 'Closed'
      ? 'Inactive'
      : 'Active'
  const priorityRaw = String(row.priority ?? 'Medium')
  const priority = (['Critical', 'High', 'Medium', 'Low'].includes(priorityRaw)
    ? priorityRaw
    : 'Medium') as Lead['priority']
  const budget = Number(row.budget ?? row.quotation ?? 0) || 0
  const rawAssigneeId = row.assigned_employment_id ?? row.assignedEmploymentId
  const assigneeId =
    rawAssigneeId != null && Number.isFinite(Number(rawAssigneeId))
      ? Number(rawAssigneeId)
      : null
  const assigned =
    (row.assignee_name as string | undefined) ??
    row.assignedTo ??
    row.assigned_to ??
    (assigneeId != null ? `Employee #${assigneeId}` : undefined)
  const assigneeIdRaw = row.assigned_employment_id ?? row.assignedEmploymentId
  const platformIdRaw = row.platform_id ?? row.platformId
  return {
    id: id.startsWith('LD-') ? id : `LD-${id}`,
    title: String(row.title ?? row.lead_title ?? contactName),
    company: String(row.company ?? row.client_name ?? ''),
    contactName,
    contactTitle: String(row.contactTitle ?? row.contact_title ?? '') || undefined,
    industry: (row.industry as string | undefined) ?? undefined,
    email: (row.email as string | undefined) ?? undefined,
    phone: (row.phone as string | undefined) ?? undefined,
    source: String(
      row.platform_name ?? row.platformName ?? row.source ?? 'Manual',
    ),
    priority,
    status,
    stage,
    budget,
    createdAt: String(row.createdAt ?? row.created_at ?? '').slice(0, 10) || '',
    date: String(row.date ?? row.expected_close_date ?? row.created_at ?? '').slice(0, 10) || undefined,
    assignedTo: assigned != null ? String(assigned) : undefined,
    assignedEmploymentId:
      assigneeIdRaw != null && Number.isFinite(Number(assigneeIdRaw))
        ? Number(assigneeIdRaw)
        : null,
    platformId:
      platformIdRaw != null && Number.isFinite(Number(platformIdRaw))
        ? Number(platformIdRaw)
        : null,
    notes: (row.notes as string | undefined) ?? (row.description as string | undefined),
    chatLink: (row.chatLink as string | undefined) ?? (row.chat_link as string | undefined),
    autoCreateProject: Boolean(row.autoCreateProject ?? row.auto_create_project ?? false),
  }
}

export async function listPlatforms(includeArchived = false): Promise<PlatformOption[]> {
  if (env.useMockApi) {
    await delay()
    return MOCK_PLATFORMS.map((p) => ({ ...p }))
  }
  const { data } = await apiClient.get<
    | Array<{ id: number; name: string; description?: string | null; is_archived?: boolean }>
    | { items?: Array<{ id: number; name: string; description?: string | null; is_archived?: boolean }> }
  >('/sales/sources', { params: { include_archived: includeArchived } })
  const rows = Array.isArray(data) ? data : (data.items ?? [])
  return rows
    .filter((r) => includeArchived || !r.is_archived)
    .map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      description: r.description ?? null,
    }))
}

export async function getLeadFilterOptions(): Promise<LeadFilterOptions> {
  if (env.useMockApi) {
    await delay()
    const items = leads()
    const uniq = (vals: string[]) => Array.from(new Set(vals.filter(Boolean))).sort()
    return {
      statuses: uniq([...items.map((l) => l.status), 'Active', 'Inactive']),
      stages: uniq([
        ...items.map((l) => l.stage),
        'New',
        'Contacted',
        'Qualified',
        'Proposal',
        'Negotiation',
        'Won',
        'Lost',
      ]),
      priorities: uniq([...items.map((l) => l.priority), 'Critical', 'High', 'Medium', 'Low']),
      sources: MOCK_PLATFORMS.map((p) => p.name),
    }
  }
  try {
    const { data } = await apiClient.get<LeadFilterOptions>('/sales/meta/lead-filter-options')
    return normalizeFilterOptions(data)
  } catch {
    const { data } = await apiClient.get<LeadFilterOptions>('/sales/leads/filter-options')
    return normalizeFilterOptions(data)
  }
}

/**
 * Backend returns canonical stage CODES; UI works in labels.
 * Normalize to labels + dedupe so no semantic duplicates render.
 */
function normalizeFilterOptions(data: LeadFilterOptions): LeadFilterOptions {
  const stages = Array.from(
    new Set((data.stages ?? []).map((s) => leadStageLabel(s))),
  )
  return { ...data, stages }
}

export async function listSalesRepresentatives(): Promise<SalesRepOption[]> {
  if (env.useMockApi) {
    await delay()
    const names = Array.from(new Set(leads().map((l) => l.assignedTo).filter(Boolean) as string[]))
    return names.map((name, i) => ({
      employmentId: i + 1,
      name,
      employeeCode: `SALES-${i + 1}`,
      department: 'Sales',
    }))
  }
  const { data } = await apiClient.get<{ items: SalesRepOption[]; total: number }>(
    '/sales/sales-representatives',
  )
  return data.items ?? []
}

export async function listLeads(params?: {
  search?: string
  status?: string
  stage?: string
  priority?: string
  source?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Lead[]; total: number; metrics: SalesMetric[] }> {
  if (!env.useMockApi) {
    // Backend has no `stage` query param — translate the UI label to a
    // LeadStatus code and filter server-side via `status`. RecordStatus
    // Active/Inactive maps to no-filter / CLOSED (mirrors backend
    // lead_ui.parse_stage_or_status).
    const stageCode =
      params?.stage && params.stage !== 'All' ? stageLabelToCode(params.stage) : undefined
    const recordStatus = params?.status && params.status !== 'All' ? params.status : undefined
    const statusParam =
      recordStatus === 'Inactive' ? 'CLOSED' : (stageCode ?? undefined)
    const { data } = await apiClient.get<
      | Lead[]
      | Array<Record<string, unknown>>
      | { items: Array<Record<string, unknown>>; total: number; metrics?: SalesMetric[] }
    >('/sales/leads', {
      params: {
        search: params?.search,
        status: statusParam,
        priority: params?.priority && params.priority !== 'All' ? params.priority : undefined,
        limit: params?.pageSize ?? 200,
        offset:
          params?.page != null && params?.pageSize != null
            ? (Math.max(params.page, 1) - 1) * params.pageSize
            : 0,
      },
    })
    const raw = Array.isArray(data) ? data : (data.items ?? [])
    const items = raw.map((r) => mapApiLead(r as Record<string, unknown>))
    const total = Array.isArray(data) ? items.length : Number(data.total ?? items.length)
    const metrics = Array.isArray(data) ? [] : (data.metrics ?? [])
    return { items, total, metrics }
  }
  await delay()
  let items = [...leads()]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (l) =>
        (l.contactName ?? '').toLowerCase().includes(q) ||
        (l.title ?? '').toLowerCase().includes(q) ||
        (l.id ?? '').toLowerCase().includes(q) ||
        (l.company ?? '').toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') items = items.filter((l) => l.status === params.status)
  if (params?.stage && params.stage !== 'All') items = items.filter((l) => l.stage === params.stage)
  if (params?.priority && params.priority !== 'All')
    items = items.filter((l) => l.priority === params.priority)
  if (params?.source && params.source !== 'All') items = items.filter((l) => l.source === params.source)
  if (params?.page != null || params?.pageSize != null) {
    const page = paginateItems(items, params.page, params.pageSize)
    return { items: page.items, total: page.total, metrics: salesMetrics }
  }
  return { items, total: items.length, metrics: salesMetrics }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (!env.useMockApi) {
    try {
      const numeric = id.replace(/^LD-/i, '')
      const { data } = await apiClient.get<Record<string, unknown>>(`/sales/leads/${numeric}`)
      if ((data as { detail?: string }).detail) return null
      return mapApiLead(data)
    } catch {
      return null
    }
  }
  await delay()
  return leads().find((l) => l.id === id) ?? null
}

function mapStageToLeadStatus(stage?: string, recordStatus?: string): string {
  if ((recordStatus ?? '').toLowerCase() === 'inactive') return 'CLOSED'
  const s = (stage ?? 'New').toUpperCase().replace(/\s+/g, '_')
  const map: Record<string, string> = {
    NEW: 'NEW',
    CONTACTED: 'CHAT_OPEN',
    QUALIFIED: 'MEETING',
    PROPOSAL: 'PROPOSAL_SENT',
    NEGOTIATION: 'PAYMENT_DISCUSSION',
    WON: 'WON',
    LOST: 'LOST',
    FOLLOW_UP: 'FOLLOW_UP',
    FOLLOWUP: 'FOLLOW_UP',
    CLOSED: 'CLOSED',
    ACTIVE: 'NEW',
  }
  return (
    map[s] ??
    ([
      'NEW',
      'PROPOSAL_SENT',
      'CHAT_OPEN',
      'MEETING',
      'EXECUTION_PLAN_SENT',
      'PAYMENT_DISCUSSION',
      'WON',
      'LOST',
      'FOLLOW_UP',
      'CLOSED',
    ].includes(s)
      ? s
      : 'NEW')
  )
}

function toBackendLeadCreate(input: CreateLeadInput): Record<string, unknown> {
  return {
    lead_title: input.title,
    title: input.title,
    contact_name: input.contactName,
    contactName: input.contactName,
    contact_title: input.contactTitle || null,
    contactTitle: input.contactTitle || null,
    platform_id: input.platformId ?? null,
    email: input.email || null,
    phone: input.phone || null,
    quotation: input.budget ?? null,
    budget: input.budget ?? null,
    expected_close_date: input.date || null,
    assigned_employment_id: input.assignedEmploymentId ?? null,
    assignedEmploymentId: input.assignedEmploymentId ?? null,
    description: input.notes || null,
    notes: input.notes || null,
    chat_link: input.chatLink || null,
    chatLink: input.chatLink || null,
    priority: input.priority || null,
    client_name: input.company || null,
    company: input.company || null,
    status: mapStageToLeadStatus(input.stage, input.status),
    stage: input.stage,
    auto_create_project: input.auto_create_project ?? false,
  }
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Record<string, unknown>>('/sales/leads', toBackendLeadCreate(input))
    return mapApiLead(data)
  }
  await delay(400)
  const list = leads()
  const id = `LD-${1000 + list.length + 1}`
  const platformName =
    input.platformId != null
      ? MOCK_PLATFORMS.find((p) => p.id === input.platformId)?.name
      : undefined
  const row: Lead = {
    id,
    title: input.title,
    company: input.company ?? '',
    contactName: input.contactName,
    contactTitle: input.contactTitle,
    industry: input.industry,
    email: input.email,
    phone: input.phone,
    source: platformName ?? input.source ?? 'Manual',
    priority: input.priority ?? 'Medium',
    status: input.status ?? 'Active',
    stage: input.stage ?? 'New',
    budget: input.budget ?? 0,
    createdAt: new Date().toISOString().slice(0, 10),
    date: input.date ?? new Date().toISOString().slice(0, 10),
    assignedTo: input.assignedTo,
    notes: input.notes,
    chatLink: input.chatLink,
  }
  list.unshift(row)
  return row
}

export async function updateLead(
  id: string,
  patch: Partial<Lead> & {
    assignedEmploymentId?: number | null
    platformId?: number | null
  },
): Promise<Lead> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.title != null) body.lead_title = patch.title
    if (patch.contactName != null) body.contact_name = patch.contactName
    if (patch.contactTitle != null) body.contact_title = patch.contactTitle
    if (patch.email != null) body.email = patch.email
    if (patch.phone != null) body.phone = patch.phone
    if (patch.notes != null) body.description = patch.notes
    if (patch.budget != null) body.quotation = patch.budget
    if (patch.date != null) body.expected_close_date = patch.date
    if (patch.priority != null) body.priority = patch.priority
    if (patch.chatLink != null) body.chat_link = patch.chatLink
    if (patch.platformId !== undefined) body.platform_id = patch.platformId
    if (patch.assignedEmploymentId !== undefined)
      body.assigned_employment_id = patch.assignedEmploymentId
    if (patch.stage != null) body.stage = patch.stage
    if (patch.status != null) body.status = patch.status
    if (patch.stage != null || patch.status != null) {
      body.status = mapStageToLeadStatus(patch.stage, patch.status)
    }
    const numeric = id.replace(/^LD-/i, '')
    const { data } = await apiClient.patch<Record<string, unknown>>(`/sales/leads/${numeric}`, body)
    return mapApiLead(data)
  }
  await delay(350)
  const list = leads()
  const idx = list.findIndex((l) => l.id === id)
  if (idx < 0) throw new Error('Lead not found')
  list[idx] = { ...list[idx], ...patch, id }
  return list[idx]
}

/** Soft-delete a lead (backend archives + syncs status to CLOSED). */
export async function deleteLead(id: string): Promise<void> {
  if (!env.useMockApi) {
    const numeric = id.replace(/^LD-/i, '')
    await apiClient.delete(`/sales/leads/${numeric}`)
    return
  }
  await delay(300)
  const list = leads()
  const idx = list.findIndex((l) => l.id === id)
  if (idx >= 0) list.splice(idx, 1)
}

export async function changeLeadStage(  id: string,
  stage: PipelineStage,
  opts?: { auto_create_project?: boolean },
): Promise<Lead | null> {
  if (stage === 'Won') {
    if (!env.useMockApi) {
      const numeric = id.replace(/^LD-/i, '')
      await apiClient.post(`/sales/leads/${numeric}/status`, {
        status: 'WON',
        ...(opts?.auto_create_project != null
          ? { auto_create_project: opts.auto_create_project }
          : {}),
      })
      return getLeadById(id)
    }
    await delay(350)
    const list = leads()
    const idx = list.findIndex((l) => l.id === id)
    if (idx < 0) throw new Error('Lead not found')
    list[idx] = { ...list[idx], stage: 'Won', status: 'Inactive', id }
    return list[idx]
  }
  return updateLead(id, { stage, status: 'Active' })
}
