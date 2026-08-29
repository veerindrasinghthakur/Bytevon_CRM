import type { PipelineStage, ActivityType } from '../types'
import { useLeadsQuery } from './use-sales'
import { useSalesActivities } from './use-sales'
import { PipelineStageValues } from '../schemas/enums'
import { typeIcon } from '../schemas/cssTokens'

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
