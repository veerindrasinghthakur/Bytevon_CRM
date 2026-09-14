import { useMemo } from 'react'
import {
  useClientsQuery,
  useLeadsQuery,
  useSalesActivities,
  useSalesDashboardMetrics,
} from '../use-sales'
import { typeIcon } from '../../schemas/enums'
import {
  activityGroups,
  monthlyLeadGrowth,
  pipelineValue,
  recentLeads,
  stageCounts,
  topActiveClients,
  topPerformers,
  wonCount,
} from '../../lib/dashboard-compute'

export function useSalesDashboard() {
  const leadsQuery = useLeadsQuery()
  const clientsQuery = useClientsQuery()
  const { data: activities = [] } = useSalesActivities()
  const { data: metrics = [] } = useSalesDashboardMetrics()

  const leads = useMemo(() => leadsQuery.data?.items ?? [], [leadsQuery.data])
  const clients = useMemo(() => clientsQuery.data?.items ?? [], [clientsQuery.data])

  const recentLeadsData = useMemo(() => recentLeads(leads), [leads])
  const topClientsData = useMemo(() => topActiveClients(clients), [clients])
  const stageCountsData = useMemo(() => stageCounts(leads), [leads])
  const maxFunnel = Math.max(1, ...stageCountsData.map((entry) => entry.count))
  const pipeline = useMemo(() => pipelineValue(leads), [leads])
  const won = useMemo(() => wonCount(leads), [leads])
  const avgDealSize = won > 0 ? pipeline / won : 0

  const growth = useMemo(() => monthlyLeadGrowth(leads), [leads])
  const performers = useMemo(() => topPerformers(leads), [leads])
  const groups = useMemo(() => activityGroups(activities), [activities])

  return {
    metrics,
    recentLeads: recentLeadsData,
    topClients: topClientsData,
    stageCounts: stageCountsData,
    maxFunnel,
    pipelineValue: pipeline,
    maxGrowth: growth.maxGrowth,
    monthlyGrowth: growth.months.map(({ month, leads: count }) => ({ month, leads: count })),
    topPerformers: performers,
    activityGroups: groups,
    wonCount: won,
    avgDealSize,
    typeIcon,
  }
}
