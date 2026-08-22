import { delay } from '@/shared/mock/db'
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
import type { Lead, Client, CaseStudy, SalesActivity, SalesMetric } from '../types'

/** Mutable in-memory stores — seeded once from mock (mock-data rules: UI never hardcodes lists). */
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

export async function listLeads(params?: {
  search?: string
  status?: string
  stage?: string
  priority?: string
  source?: string
}): Promise<{ items: Lead[]; total: number; metrics: SalesMetric[] }> {
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
  return { items, total: leads().length, metrics: salesMetrics }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  await delay()
  return leads().find((l) => l.id === id) ?? null
}

export async function createLead(input: {
  title: string
  company: string
  contactName: string
  email?: string
  source?: string
  priority?: Lead['priority']
}): Promise<Lead> {
  await delay(400)
  const list = leads()
  const id = `LD-${1000 + list.length + 1}`
  const row: Lead = {
    id,
    title: input.title,
    company: input.company,
    contactName: input.contactName,
    email: input.email,
    source: input.source ?? 'Manual',
    priority: input.priority ?? 'Medium',
    status: 'Active',
    stage: 'New',
    budget: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    date: new Date().toISOString().slice(0, 10),
  }
  list.unshift(row)
  return row
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
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
}): Promise<{ items: Client[]; total: number; metrics: SalesMetric[] }> {
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
  return { items, total: clients().length, metrics: clientMetrics }
}

export async function getClientById(id: string): Promise<Client | null> {
  await delay()
  return clients().find((c) => c.id === id) ?? null
}

export async function createClient(input: {
  name: string
  industry?: string
  type?: Client['type']
  country?: string
}): Promise<Client> {
  await delay(400)
  const list = clients()
  const row: Client = {
    id: `c${list.length + 1}`,
    name: input.name,
    type: input.type ?? 'SMB',
    status: 'Active',
    industry: input.industry ?? '—',
    country: input.country ?? '—',
    projects: 0,
    leads: 0,
    logoInitials: input.name.slice(0, 2).toUpperCase(),
  }
  list.unshift(row)
  return row
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  await delay(350)
  const list = clients()
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0) throw new Error('Client not found')
  list[idx] = { ...list[idx], ...patch, id }
  return list[idx]
}

export async function listCaseStudies(): Promise<{ items: CaseStudy[]; metrics: SalesMetric[] }> {
  await delay()
  return { items: seedCaseStudies, metrics: caseStudyMetrics }
}

export async function listSalesActivities(): Promise<SalesActivity[]> {
  await delay()
  return seedActivities
}

export async function getDashboardMetrics(): Promise<SalesMetric[]> {
  await delay()
  return dashboardMetrics
}
