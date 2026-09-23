import { useNavigate } from '@tanstack/react-router'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useSalesDashboard } from '../../hooks/dashboard/use-dashboard'
import { salesRoutes } from '../../routes'
import { DashboardMetricsCards } from '../../components/dashboard/DashboardMetricsCards'
import { RevenueOverview } from '../../components/dashboard/RevenueOverview'
import { LeadGrowthChart } from '../../components/dashboard/LeadGrowthChart'
import { SalesFunnel } from '../../components/dashboard/SalesFunnel'
import { TopPerformers } from '../../components/dashboard/TopPerformers'
import { RecentLeadsTable } from '../../components/dashboard/RecentLeadsTable'
import { ActivityTimelinePanel } from '../../components/dashboard/ActivityTimelinePanel'
import { TopClientsGrid } from '../../components/dashboard/TopClientsGrid'

export function SalesDashboardPage() {
  const navigate = useNavigate()
  const {
    metrics,
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
    wonValue,
    avgDealSize,
  } = useSalesDashboard()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sales Dashboard"
        description="Pipeline health, revenue, funnel, activity, and top performers."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              leftIcon={<span className="material-symbols-outlined text-lg">person_search</span>}
              onClick={() => safeNavigate(navigate, { to: salesRoutes.leads })}
            >
              View Leads
            </Button>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
              onClick={() => safeNavigate(navigate, { to: salesRoutes.leadNew })}
            >
              New Lead
            </Button>
          </div>
        }
      />

      <DashboardMetricsCards metrics={metrics ?? []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueOverview
          pipelineValue={pipelineValue}
          avgDealSize={avgDealSize}
          wonCount={wonCount}
          wonValue={wonValue}
        />
        <LeadGrowthChart monthlyGrowth={monthlyGrowth ?? []} maxGrowth={maxGrowth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesFunnel stageCounts={stageCounts ?? []} maxFunnel={maxFunnel} />
        <TopPerformers topPerformers={topPerformers ?? []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <RecentLeadsTable
          recentLeads={recentLeads ?? []}
          onViewAll={() => safeNavigate(navigate, { to: salesRoutes.root })}
          onOpenLead={(leadId) =>
            safeNavigate(navigate, {
              to: salesRoutes.leadDetailPath,
              params: { leadId },
            })
          }
        />
        <ActivityTimelinePanel activityGroups={activityGroups ?? {}} />
      </div>

      <TopClientsGrid
        topClients={topClients ?? []}
        onViewAll={() => safeNavigate(navigate, { to: salesRoutes.clients })}
        onOpenClient={(clientId) =>
          safeNavigate(navigate, {
            to: salesRoutes.clientDetailPath,
            params: { clientId },
          })
        }
      />
    </div>
  )
}
