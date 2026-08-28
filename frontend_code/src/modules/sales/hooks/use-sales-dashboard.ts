import type { PipelineStage, ActivityType } from '../types'
import { useLeadsQuery } from './use-sales'
import { useSalesActivities } from './use-sales'

const funnelStages: PipelineStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
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
  const { data: leads = [] } = useLeadsQuery()

  const {
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
  } = useSalesActivities()

  const recentLeadsData = leads?.slice(0, 5) ?? recentLeads?.slice(0, 5) ?? []
  const topClientsData = topClients?.filter((c) => c.status === 'Active').slice(0, 4) ?? []

  return {
    metrics: [],
    recentLeads: recentLeadsData,
    topClients: topClientsData,
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
