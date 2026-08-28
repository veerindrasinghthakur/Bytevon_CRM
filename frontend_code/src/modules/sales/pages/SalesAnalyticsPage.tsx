import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import type { PipelineStage } from '../types'
import { cn } from '@/shared/lib/cn'
import { salesRoutes } from '../routes'
import { useSalesDashboardMetrics } from '../hooks/use-sales'

export function SalesAnalyticsPage() {
  const { data: metrics, isLoading, isError } = useSalesDashboardMetrics()

  const stages: PipelineStage[] = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost',
  ]

  const stageColors: Record<PipelineStage, string> = {
    New: 'bg-slate-400',
    Contacted: 'bg-blue-400',
    Qualified: 'bg-blue-600',
    Proposal: 'bg-orange-400',
    Negotiation: 'bg-amber-500',
    Won: 'bg-emerald-500',
    Lost: 'bg-red-400',
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sales Analytics" showBack backTo={salesRoutes.root} backLabel="Back to sales" />
        <div>Loading...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="animate-fade-in text-center py-16 space-y-4">
        <PageHeader title="Error loading analytics" showBack backTo={salesRoutes.root} backLabel="Back to sales" />
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const pipelineValue = metrics?.find((m) => m.id === 'pipeline')?.value || '—'
  const totalLeads = metrics?.find((m) => m.id === 'total-leads')?.value || '—'
  const activeClients = metrics?.find((m) => m.id === 'active-clients')?.value || '—'

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sales Analytics"
        description="Pipeline distribution, conversion signals, and commercial snapshot."
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={salesRoutes.root} className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">Analytics</span>
          </nav>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics?.map((m) => (
          <div
            key={m.id}
            className={cn(
              'p-5 rounded-xl border border-outline-variant executive-shadow card-hover',
              m.id === 'pipeline'
                ? 'bg-primary-container text-white border-primary-container'
                : 'bg-surface-container-lowest'
            )}
          >
            <p className={cn('text-label-md', m.id === 'pipeline' ? 'text-white/70' : 'text-on-surface-variant')}>
              {m.label}
            </p>
            <h3 className={cn('text-headline-md font-bold mt-1', m.id === 'pipeline' ? 'text-white' : 'text-on-background')}>
              {m.value}
            </h3>
            {m.change && (
              <p
                className={cn(
                  'text-[11px] mt-1 font-semibold',
                  m.id === 'pipeline'
                    ? 'text-white/60'
                    : m.changeType === 'positive'
                      ? 'text-emerald-600'
                      : m.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-on-surface-variant'
                )}
              >
                {m.change}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bv-surface card-hover p-6">
          <h2 className="text-title-md font-semibold mb-5">Pipeline by stage</h2>
          <div className="space-y-3">
            {stages.map((stage) => {
              const stageMetric = metrics?.find((m) => m.id === stage.toLowerCase().replace(/\s/g, '-'))
              const count = stageMetric ? parseInt(stageMetric.value) : 0
              const maxCount = Math.max(...stages.map((s) => {
                const m = metrics?.find((m) => m.id === s.toLowerCase().replace(/\s/g, '-'))
                return parseInt(m?.value) || 0
              }), 1)
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-on-surface">{stage}</span>
                    <span className="text-on-surface-variant">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', stageColors[stage])}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bv-surface card-hover p-6">
          <h2 className="text-title-md font-semibold mb-5">Snapshot</h2>
          <dl className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low">
              <dt className="text-on-surface-variant">Total Leads</dt>
              <dd className="font-bold text-on-background">{totalLeads}</dd>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low">
              <dt className="text-on-surface-variant">Active Clients</dt>
              <dd className="font-bold text-on-background">{activeClients}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
