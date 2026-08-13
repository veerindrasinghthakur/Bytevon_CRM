import { delay, getDb, nextId } from '@/shared/mock/db'

export interface Lead {
  id: number
  title: string
  company: string
  contactName: string
  email: string
  phone?: string
  status: string
  source?: string
  value?: number
  currency?: string
  ownerName?: string
  clientId?: number | null
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: number
  name: string
  industry?: string
  status: string
  primaryContact?: string
  email?: string
  phone?: string
  website?: string | null
  country?: string
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asLead(row: any): Lead {
  return { ...row }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asClient(row: any): Client {
  return { ...row }
}

export async function getLeads(params?: { search?: string }) {
  await delay()
  let items = getDb().leads.map(asLead)
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q)
    )
  }
  return { items, total: items.length }
}

export async function createLead(input: {
  title: string
  company: string
  contactName: string
  email: string
}): Promise<Lead> {
  await delay(400)
  const leads = getDb().leads
  const now = new Date().toISOString()
  const row = {
    id: nextId(leads),
    title: input.title,
    company: input.company,
    contactName: input.contactName,
    email: input.email,
    phone: null,
    status: 'NEW',
    source: 'Manual',
    value: 0,
    currency: 'USD',
    ownerName: 'Admin User',
    clientId: null,
    createdAt: now,
    updatedAt: now,
  }
  leads.unshift(row)
  return asLead(row)
}

export async function getClients(params?: { search?: string }) {
  await delay()
  let items = getDb().clients.map(asClient)
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q) ||
        (c.primaryContact ?? '').toLowerCase().includes(q)
    )
  }
  return { items, total: items.length }
}

export async function createClient(input: { name: string; industry?: string }): Promise<Client> {
  await delay(400)
  const clients = getDb().clients
  const row = {
    id: nextId(clients),
    name: input.name,
    industry: input.industry ?? null,
    status: 'ACTIVE',
    primaryContact: null,
    email: null,
    phone: null,
    website: null,
    country: null,
    createdAt: new Date().toISOString(),
  }
  clients.unshift(row)
  return asClient(row)
}
