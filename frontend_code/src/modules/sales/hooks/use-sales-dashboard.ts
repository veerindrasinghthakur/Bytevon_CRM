import {
  dashboardMetrics,
  leads,
  clients,
  salesActivities,
} from '../data/mock'
import type { PipelineStage, ActivityType } from '../types'

const funnelStages: PipelineStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
]

const topPerformers = [
  { name: 'Alex Rivera', role: 'Global Sales Lead', deals: 3, value: 445000, winRate: '42%' },
  { name: 'Marcus Sterling', role: 'Enterprise AE', deals: 1, value: 280000, winRate: '38%' },
  { name: 'Sarah Chen', role: 'Account Executive', deals: 1, value: 120000, winRate: '35%' },
  { name: 'Sarah Jenkins', role: 'Sales Manager', deals: 2, value: 95000, winRate: '31%' },
]

const monthlyGrowth = [
  { month: 'Jul', leads: 98 },
  { month: 'Aug', leads: 112 },
  { month: 'Sep', leads: 105 },
  { month: 'Oct', leads: 128 },
  { month: 'Nov', leads: 134 },
  { month: 'Dec', leads: 142 },
]

export const typeIcon: Record<ActivityType, string> = {
  'Lead Created': 'person_add',
  'Lead Won': 'emoji_events',
  'Meeting Scheduled': 'event',
  'Email Sent': 'mail',
  Call: 'call',
  'Document Viewed': 'description',
  'System Alert': 'warning',
  'Contract Renewed': 'autorenew',
  'Proposal Sent': 'send',
}

export function useSalesDashboard() {
  const recentLeads = leads.slice(0, 5)
  const topClients = clients.filter((c) => c.status === 'Active').slice(0, 4)

  const stageCounts = funnelStages.map((s) => ({
    stage: s,
    count: leads.filter((l) => l.stage === s).length,
  }))
  const maxFunnel = Math.max(...stageCounts.map((x) => x.count), 1)
  const pipelineValue = leads.reduce((sum, l) => sum + l.budget, 0)
  const maxGrowth = Math.max(...monthlyGrowth.map((m) => m.leads), 1)
  const wonCount = leads.filter((l) => l.stage === 'Won').length
  const avgDealSize = Math.round(pipelineValue / Math.max(leads.length, 1))

  const activityGroups = salesActivities.reduce<Record<string, typeof salesActivities>>((acc, a) => {
    ;(acc[a.dateGroup] ??= []).push(a)
    return acc
  }, {})

  return {
    metrics: dashboardMetrics,
    recentLeads,
    topClients,
    stageCounts,
    maxFunnel,
    pipelineValue,
    maxGrowth,
    monthlyGrowth,
    topPerformers,
    activityGroups,
    wonCount,
    avgDealSize,
    typeIcon,
  }
}
