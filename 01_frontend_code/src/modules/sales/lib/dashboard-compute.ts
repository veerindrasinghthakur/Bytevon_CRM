/** Pure dashboard aggregations — no React / query keys. */
import { PipelineStageValues } from '../schemas/enums'
import type { Client, Lead, SalesActivity } from '../types'

export function recentLeads(leads: Lead[], limit = 5): Lead[] {
  return [...leads].slice(0, limit)
}

export function topActiveClients(clients: Client[], limit = 4): Client[] {
  return clients.filter((c) => c.status === 'Active').slice(0, limit)
}

export function stageCounts(leads: Lead[]) {
  return PipelineStageValues.map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.stage === stage).length,
  }))
}

export function pipelineValue(leads: Lead[]): number {
  return openLeads(leads).reduce((total, lead) => total + (lead.budget ?? 0), 0)
}

const CLOSED_STAGES: Lead['stage'][] = ['Won', 'Lost', 'Closed']

/** Leads still in play — excludes Won / Lost / Closed and inactive records. */
export function openLeads(leads: Lead[]): Lead[] {
  return leads.filter((lead) => lead.status !== 'Inactive' && !CLOSED_STAGES.includes(lead.stage))
}

/** Closed-won revenue — sum of budgets on leads in the Won stage. */
export function wonValue(leads: Lead[]): number {
  return leads
    .filter((lead) => lead.stage === 'Won')
    .reduce((total, lead) => total + (lead.budget ?? 0), 0)
}

export function wonCount(leads: Lead[]): number {
  return leads.filter((lead) => lead.stage === 'Won').length
}

export function monthlyLeadGrowth(leads: Lead[], monthsBack = 6) {
  const months = Array.from({ length: monthsBack }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (monthsBack - 1 - index))
    const month = date.toLocaleString('en-US', { month: 'short' })
    const leadsForMonth = leads.filter((lead) => {
      const createdAt = lead.createdAt ?? lead.date
      if (!createdAt) return false
      const created = new Date(createdAt)
      return (
        !Number.isNaN(created.getTime()) &&
        created.getFullYear() === date.getFullYear() &&
        created.getMonth() === date.getMonth()
      )
    }).length
    return { month, leads: leadsForMonth }
  })
  const maxMonthCount = Math.max(1, ...months.map((m) => m.leads))
  return {
    months: months.map((m) => ({ ...m, height: m.leads / maxMonthCount })),
    maxGrowth: maxMonthCount,
  }
}

export function topPerformers(leads: Lead[], limit = 4) {
  const grouped = new Map<
    string,
    { name: string; role: string; value: number; deals: number; wins: number }
  >()

  for (const lead of leads) {
    const rep = lead.assignedTo ?? 'Unassigned'
    const current = grouped.get(rep) ?? {
      name: rep,
      role: 'Sales Rep',
      value: 0,
      deals: 0,
      wins: 0,
    }
    current.value += lead.budget ?? 0
    current.deals += 1
    if (lead.stage === 'Won') current.wins += 1
    grouped.set(rep, current)
  }

  return [...grouped.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((person) => ({
      name: person.name,
      role: person.role,
      value: person.value,
      deals: person.deals,
      winRate:
        person.deals > 0
          ? `${Math.round((person.wins / person.deals) * 100)}%`
          : '0%',
    }))
}

export function activityGroups(activities: SalesActivity[]) {
  return activities.reduce(
    (acc, activity) => {
      const bucket = activity.dateGroup ?? 'Recent'
      acc[bucket] = acc[bucket] ?? []
      acc[bucket].push(activity)
      return acc
    },
    {} as Record<string, SalesActivity[]>,
  )
}
