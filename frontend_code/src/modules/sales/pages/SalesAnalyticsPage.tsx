import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { salesMetrics, leads, clients } from '../data/mock'
import type { PipelineStage } from '../types'
import { cn } from '@/shared/lib/cn'

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

export function SalesAnalyticsPage() {
  const stageCounts = stages.map((s) => ({
    stage: s,
    count: leads.filter((l) => l.stage === s).length,
  }))
  const maxCount = Math.max(...stageCounts.map((x) => x.count), 1)
  const pipelineValue = leads.reduce((sum, l) => sum + l.budget, 0)
  const activeClients = clients.filter((c) => c.status === 'Active').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Analytics"
        description="Pipeline distribution, conversion signals, and commercial snapshot."
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">Analytics</span>
          </nav>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {salesMetrics.map((m) => (
          <div
            key={m.id}
            className={cn(
              'p-5 rounded-xl border border-outline-variant shadow-sm',
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
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="text-title-md font-semibold mb-5">Pipeline by stage</h2>
          <div className="space-y-3">
            {stageCounts.map(({ stage, count }) => (
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
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="text-title-md font-semibold mb-5">Snapshot</h2>
          <dl className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low">
              <dt className="text-on-surface-variant">Mock pipeline value (listed leads)</dt>
              <dd className="font-bold text-on-background">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                  pipelineValue
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low">
              <dt className="text-on-surface-variant">Active clients (sample)</dt>
              <dd className="font-bold text-on-background">{activeClients}</dd>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low">
              <dt className="text-on-surface-variant">Leads in sample set</dt>
              <dd className="font-bold text-on-background">{leads.length}</dd>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low">
              <dt className="text-on-surface-variant">Won in sample</dt>
              <dd className="font-bold text-emerald-700">{leads.filter((l) => l.stage === 'Won').length}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
