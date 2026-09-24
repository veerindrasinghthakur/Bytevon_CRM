import { describe, expect, it } from 'vitest'
import {
  openLeads,
  pipelineValue,
  recentLeads,
  stageCounts,
  topActiveClients,
  wonCount,
  wonValue,
} from '@/modules/sales/lib/dashboard-compute'
import { getDashboardMetrics } from '@/modules/sales/api/dashboard'
import { listLeads as listLeadsApi } from '@/modules/sales/api/lead'
import { listClients as listClientsApi } from '@/modules/sales/api/client'

const leads = [
  { id: '1', stage: 'New', budget: 100, assignedTo: 'A' },
  { id: '2', stage: 'Won', budget: 200, assignedTo: 'A' },
  { id: '3', stage: 'Won', budget: 300, assignedTo: 'B' },
] as never[]

describe('sales dashboard-compute', () => {
  it('recentLeads caps at limit preserving order', () => {
    expect(recentLeads(leads, 2)).toHaveLength(2)
    expect(recentLeads([], 5)).toEqual([])
  })
  it('stageCounts covers every pipeline stage', () => {
    const counts = stageCounts(leads)
    expect(counts.reduce((s, c) => s + c.count, 0)).toBe(3)
    expect(counts.find((c) => c.stage === 'Won')?.count).toBe(2)
  })
  it('pipelineValue sums open-lead budgets only; wonValue sums wins', () => {
    expect(pipelineValue(leads)).toBe(100)
    expect(wonCount(leads)).toBe(2)
    expect(wonValue(leads)).toBe(500)
    expect(openLeads(leads)).toHaveLength(1)
    expect(pipelineValue([])).toBe(0)
    expect(wonValue([])).toBe(0)
  })
  it('topActiveClients filters Active only', () => {
    const clients = [
      { status: 'Active' },
      { status: 'Inactive' },
      { status: 'Active' },
    ] as never[]
    expect(topActiveClients(clients)).toHaveLength(2)
  })
})

describe('sales mock API', () => {
  it('lists leads, clients and dashboard metrics', async () => {
    const l = await listLeadsApi()
    expect(Array.isArray(l.items ?? l)).toBe(true)
    const c = await listClientsApi()
    expect(Array.isArray(c.items ?? c)).toBe(true)
    expect(Array.isArray(await getDashboardMetrics())).toBe(true)
  })
})
