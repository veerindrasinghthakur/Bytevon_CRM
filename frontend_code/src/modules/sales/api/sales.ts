/**
 * Sales API — leads, clients, case studies, filter options, sales reps.
 * env.useMockApi → local seed stores; false → mock backend /api/v1/sales/*
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { paginateItems } from '@/shared/lib/list-params'
import {
  leads as seedLeads,
  clients as seedClients,
  caseStudies as seedCaseStudies,
  salesActivities as seedActivities,
  salesMetrics,
  clientMetrics,
  dashboardMetrics,
  caseStudyMetrics,
} from '../data/mock'
import type {
  Lead,
  Client,
  CaseStudy,
  SalesActivity,
  SalesMetric,
  CreateLeadInput,
  CreateClientInput,
} from '../types'

/** Mutable in-memory stores when useMockApi */
let leadsStore: Lead[] | null = null
let clientsStore: Client[] | null = null

function leads(): Lead[] {
  if (!leadsStore) leadsStore = seedLeads.map((l) => ({ ...l }))
  return leadsStore
}

function clients(): Client[] {
  if (!clientsStore) clientsStore = seedClients.map((c) => ({ ...c }))
  return clientsStore
}

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
      sources: uniq([
        ...items.map((l) => l.source),
        'LinkedIn',
        'Website',
        'Referral',
        'Direct Referral',
        'Event',
        'Other',
        'Manual',
      ]),
    }
  }
  const { data } = await apiClient.get<LeadFilterOptions>('/sales/leads/filter-options')
  return data
}

export async function getClientFilterOptions(): Promise<ClientFilterOptions> {
  if (env.useMockApi) {
    await delay()
    const items = clients()
    const uniq = (vals: string[]) => Array.from(new Set(vals.filter(Boolean))).sort()
    return {
      statuses: uniq([...items.map((c) => c.status), 'Active', 'Inactive']),
      types: uniq([...items.map((c) => c.type), 'Enterprise', 'SMB', 'Partner']),
      industries: uniq(items.map((c) => c.industry)),
      countries: uniq(items.map((c) => c.country)),
    }
  }
  const { data } = await apiClient.get<ClientFilterOptions>('/sales/clients/filter-options')
  return data
}

/** Employees assigned to Sales department — for assigned-rep picker */
export async function listSalesRepresentatives(): Promise<SalesRepOption[]> {
  if (env.useMockApi) {
    await delay()
    const names = Array.from(
      new Set(leads().map((l) => l.assignedTo).filter(Boolean) as string[]),
    )
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
    const { data } = await apiClient.get<{ items: Lead[]; total: number; metrics: SalesMetric[] }>(
      '/sales/leads',
      { params },
    )
    return data
  }
  await delay()
  let items = [...leads()]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (l) =>
        l.contactName.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q),
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
      const { data } = await apiClient.get<Lead & { detail?: string }>(`/sales/leads/${id}`)
      if ((data as { detail?: string }).detail) return null
      return data
    } catch {
      return null
    }
  }
  await delay()
  return leads().find((l) => l.id === id) ?? null
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Lead>('/sales/leads', input)
    return data
  }
  await delay(400)
  const list = leads()
  const id = `LD-${1000 + list.length + 1}`
  const row: Lead = {
    id,
    title: input.title,
    company: input.company,
    contactName: input.contactName,
    contactTitle: input.contactTitle,
    industry: input.industry,
    email: input.email,
    phone: input.phone,
    source: input.source ?? 'Manual',
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
  patch: Partial<Lead> & { assignedEmploymentId?: number | null },
): Promise<Lead> {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<Lead>(`/sales/leads/${id}`, patch)
    return data
  }
  await delay(350)
  const list = leads()
  const idx = list.findIndex((l) => l.id === id)
  if (idx < 0) throw new Error('Lead not found')
  list[idx] = { ...list[idx], ...patch, id }
  return list[idx]
}

export async function listClients(params?: {
  search?: string
  status?: string
  type?: string
  page?: number
  pageSize?: number
}): Promise<{ items: Client[]; total: number; metrics: SalesMetric[] }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: Client[]; total: number; metrics: SalesMetric[] }>(
      '/sales/clients',
      { params },
    )
    return data
  }
  await delay()
  let items = [...clients()]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        (c.primaryContact?.toLowerCase().includes(q) ?? false) ||
        c.id.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') items = items.filter((c) => c.status === params.status)
  if (params?.type && params.type !== 'All') items = items.filter((c) => c.type === params.type)
  if (params?.page != null || params?.pageSize != null) {
    const page = paginateItems(items, params.page, params.pageSize)
    return { items: page.items, total: page.total, metrics: clientMetrics }
  }
  return { items, total: items.length, metrics: clientMetrics }
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<Client & { detail?: string }>(`/sales/clients/${id}`)
      if ((data as { detail?: string }).detail) return null
      return data
    } catch {
      return null
    }
  }
  await delay()
  return clients().find((c) => c.id === id) ?? null
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Client>('/sales/clients', input)
    return data
  }
  await delay(400)
  const list = clients()
  const row: Client = {
    id: `c${list.length + 1}`,
    name: input.name,
    legalName: input.legalName,
    type: input.type ?? 'SMB',
    status: input.status ?? 'Active',
    industry: input.industry ?? '—',
    website: input.website,
    country: input.country ?? '—',
    address: input.address,
    taxId: input.taxId,
    founded: input.founded,
    chatLink: input.chatLink,
    primaryContact: input.primaryContact,
    email: input.email,
    phone: input.phone,
    projects: 0,
    leads: 0,
    logoInitials: input.name.slice(0, 2).toUpperCase(),
    clientSince: new Date().toISOString().slice(0, 10),
  }
  list.unshift(row)
  return row
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  if (!env.useMockApi) {
    const { data } = await apiClient.patch<Client>(`/sales/clients/${id}`, patch)
    return data
  }
  await delay(350)
  const list = clients()
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0) throw new Error('Client not found')
  list[idx] = { ...list[idx], ...patch, id }
  return list[idx]
}

export async function listCaseStudies(params?: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<{ items: CaseStudy[]; total: number; metrics: SalesMetric[] }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: CaseStudy[]; total?: number; metrics: SalesMetric[] }>(
      '/sales/case-studies',
      { params },
    )
    return {
      items: data.items ?? [],
      total: data.total ?? data.items?.length ?? 0,
      metrics: data.metrics ?? [],
    }
  }
  await delay()
  let items = [...seedCaseStudies]
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (cs) =>
        cs.title.toLowerCase().includes(q) ||
        cs.customer.toLowerCase().includes(q) ||
        cs.industry.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'All') {
    items = items.filter((cs) => cs.status === params.status)
  }
  if (params?.page != null || params?.pageSize != null) {
    const page = paginateItems(items, params.page, params.pageSize)
    return { items: page.items, total: page.total, metrics: caseStudyMetrics }
  }
  return { items, total: items.length, metrics: caseStudyMetrics }
}

export async function listSalesActivities(): Promise<SalesActivity[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<SalesActivity[]>('/sales/activities')
    return Array.isArray(data) ? data : []
  }
  await delay()
  return seedActivities
}

export async function getDashboardMetrics(): Promise<SalesMetric[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<SalesMetric[]>('/sales/metrics/dashboard')
    return Array.isArray(data) ? data : []
  }
  await delay()
  return dashboardMetrics
}
