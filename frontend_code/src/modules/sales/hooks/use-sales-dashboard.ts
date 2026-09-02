import { useMemo } from 'react'
import { useClientsQuery, useLeadsQuery, useSalesActivities, useSalesDashboardMetrics } from './use-sales'
import { PipelineStageValues } from '../schemas/enums'
import { typeIcon } from '../schemas/cssTokens'

export function useSalesDashboard() {
  const leadsQuery = useLeadsQuery()
  const clientsQuery = useClientsQuery()
  const { data: activities = [] } = useSalesActivities()
  const { data: metrics = [] } = useSalesDashboardMetrics()

  const leads = useMemo(() => leadsQuery.data?.items ?? [], [leadsQuery.data])
  const clients = useMemo(() => clientsQuery.data?.items ?? [], [clientsQuery.data])

  const recentLeadsData = useMemo(() => [...leads].slice(0, 5), [leads])

  const topClientsData = useMemo(
    () => clients.filter((client) => client.status === 'Active').slice(0, 4),
    [clients],
  )

  const stageCounts = useMemo(
    () =>
      PipelineStageValues.map((stage) => ({
        stage,
        count: leads.filter((lead) => lead.stage === stage).length,
      })),
    [leads],
  )

  const maxFunnel = Math.max(1, ...stageCounts.map((entry) => entry.count))

  const pipelineValue = useMemo(
    () => leads.reduce((total, lead) => total + (lead.budget ?? 0), 0),
    [leads],
  )

  const wonCount = useMemo(() => leads.filter((lead) => lead.stage === 'Won').length, [leads])
  const avgDealSize = wonCount > 0 ? pipelineValue / wonCount : 0

  const monthlyGrowth = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setDate(1)
      date.setMonth(date.getMonth() - (5 - index))
      const month = date.toLocaleString('en-US', { month: 'short' })
      const leadsForMonth = leads.filter((lead) => {
        const createdAt = lead.createdAt ?? lead.date
        if (!createdAt) return false
        const created = new Date(createdAt)
        return !Number.isNaN(created.getTime())
          && created.getFullYear() === date.getFullYear()
          && created.getMonth() === date.getMonth()
      }).length
      return { month, leads: leadsForMonth }
    })

    const maxMonthCount = Math.max(1, ...months.map((month) => month.leads))
    return months.map((month) => ({ ...month, leads: month.leads, height: month.leads / maxMonthCount }))
  }, [leads])

  const topPerformers = useMemo(() => {
    const grouped = new Map<string, { name: string; role: string; value: number; deals: number; winRate: string }>()

    for (const lead of leads) {
      const rep = lead.assignedTo ?? 'Unassigned'
      const current = grouped.get(rep) ?? {
        name: rep,
        role: 'Sales Rep',
        value: 0,
        deals: 0,
        winRate: '0%',
      }

      current.value += lead.budget ?? 0
      current.deals += 1
      if (lead.stage === 'Won') {
        current.winRate = `${Math.min(100, Math.round(((current.deals || 1) / Math.max(current.deals, 1)) * 100))}%`
      }
      grouped.set(rep, current)
    }

    return [...grouped.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((person) => ({
        ...person,
        winRate: person.winRate || '0%',
      }))
  }, [leads])

  const activityGroups = useMemo(
    () =>
      activities.reduce(
        (acc, activity) => {
          const bucket = activity.dateGroup ?? 'Recent'
          acc[bucket] = acc[bucket] ?? []
          acc[bucket].push(activity)
          return acc
        },
        {} as Record<string, typeof activities>,
      ),
    [activities],
  )

  const maxGrowth = Math.max(1, ...monthlyGrowth.map((month) => month.leads))

  return {
    metrics,
    recentLeads: recentLeadsData,
    topClients: topClientsData,
    stageCounts,
    maxFunnel,
    pipelineValue,
    maxGrowth,
    monthlyGrowth: monthlyGrowth.map(({ month, leads }) => ({ month, leads })),
    topPerformers,
    activityGroups,
    wonCount,
    avgDealSize,
    typeIcon,
  }
}
