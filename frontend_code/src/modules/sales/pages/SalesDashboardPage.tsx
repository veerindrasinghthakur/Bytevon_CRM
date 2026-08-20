import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useSalesDashboard } from '../hooks/use-sales-dashboard'
import type { PipelineStage, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const stageStyles: Record<PipelineStage, string> = {
  New: 'bg-slate-100 text-slate-700',
  Contacted: 'bg-blue-50 text-blue-700',
  Qualified: 'bg-blue-100 text-blue-800',
  Proposal: 'bg-orange-100 text-orange-700',
  Negotiation: 'bg-amber-100 text-amber-800',
  Won: 'bg-emerald-100 text-emerald-800',
  Lost: 'bg-red-50 text-red-700',
}

const stageColors: Record<string, string> = {
  New: 'bg-slate-400',
  Contacted: 'bg-blue-400',
  Qualified: 'bg-blue-600',
  Proposal: 'bg-orange-400',
  Negotiation: 'bg-amber-500',
  Won: 'bg-emerald-500',
}

function StatusDot({ status }: { status: RecordStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold',
        status === 'Active' ? 'text-emerald-700' : 'text-slate-500'
      )}
    >
      <span className={cn('w-2.5 h-2.5 rounded-full', status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400')} />
      {status}
    </span>
  )
}

function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

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
    avgDealSize,
    typeIcon,
  } = useSalesDashboard()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sales Dashboard"
        description="Pipeline health, revenue, funnel, activity, and top performers."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" leftIcon={<span className="material-symbols-outlined text-lg">person_search</span>} onClick={() => navigate({ to: '/sales' })}>
              View Leads
            </Button>
            <Button variant="primary" leftIcon={<span className="material-symbols-outlined text-lg">add</span>} onClick={() => navigate({ to: '/sales/leads/new' })}>
              New Lead
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.id} className="bv-surface card-hover p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-xl">{m.icon}</span>
              </span>
              {m.change && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    m.changeType === 'positive'
                      ? 'text-emerald-700 bg-emerald-50'
                      : m.changeType === 'negative'
                        ? 'text-red-700 bg-red-50'
                        : 'text-on-surface-variant bg-surface-container'
                  )}
                >
                  {m.change}
                </span>
              )}
            </div>
            <p className="text-label-md text-on-surface-variant">{m.label}</p>
            <h3 className="text-headline-md font-bold mt-0.5 text-on-background">{m.value}</h3>
            {m.subtitle && <p className="text-[11px] mt-1 text-on-surface-variant">{m.subtitle}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bv-surface card-hover p-6">
          <h2 className="text-title-md font-semibold mb-1">Revenue overview</h2>
          <p className="text-body-sm text-on-surface-variant mb-5">Estimated pipeline and closed value</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary-container text-white">
              <p className="text-xs text-white/70 font-medium">Pipeline value</p>
              <p className="text-2xl font-bold mt-1">{formatBudget(pipelineValue)}</p>
              <p className="text-[11px] text-white/60 mt-1">From active leads</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-xs text-on-surface-variant font-medium">Est. revenue</p>
              <p className="text-2xl font-bold mt-1 text-on-background">$4.2M</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">+12% vs prior period</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-xs text-on-surface-variant font-medium">Avg. deal size</p>
              <p className="text-xl font-bold mt-1">{formatBudget(avgDealSize)}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-xs text-on-surface-variant font-medium">Won (sample)</p>
              <p className="text-xl font-bold mt-1 text-emerald-700">{wonCount}</p>
            </div>
          </div>
        </section>

        <section className="bv-surface card-hover p-6">
          <h2 className="text-title-md font-semibold mb-1">Monthly lead growth</h2>
          <p className="text-body-sm text-on-surface-variant mb-5">New leads by month (last 6)</p>
          <div className="flex items-end gap-3 h-36">
            {monthlyGrowth.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-semibold text-on-surface-variant">{m.leads}</span>
                <div
                  className="w-full rounded-t-md bg-secondary/80 hover:bg-secondary transition-colors min-h-[4px]"
                  style={{ height: `${(m.leads / maxGrowth) * 100}%` }}
                  title={`${m.month}: ${m.leads} leads`}
                />
                <span className="text-[10px] font-medium text-on-surface-variant">{m.month}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bv-surface card-hover p-6">
          <h2 className="text-title-md font-semibold mb-5">Sales funnel</h2>
          <div className="space-y-3">
            {stageCounts.map(({ stage, count }) => (
              <div key={stage}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-on-surface">{stage}</span>
                  <span className="text-on-surface-variant">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', stageColors[stage] ?? 'bg-secondary')}
                    style={{ width: `${(count / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bv-surface card-hover p-6">
          <h2 className="text-title-md font-semibold mb-5">Top performers</h2>
          <ul className="space-y-3">
            {topPerformers.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <span className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-on-surface truncate">{p.name}</p>
                  <p className="text-xs text-on-surface-variant">{p.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-on-background">{formatBudget(p.value)}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    {p.deals} deals · {p.winRate}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bv-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-background">Recent Leads</h2>
            <button type="button" className="text-label-sm text-secondary font-semibold hover:underline" onClick={() => navigate({ to: '/sales' })}>
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="zebra-row cursor-pointer"
                    onClick={() => navigate({ to: '/sales/leads/$leadId', params: { leadId: lead.id } })}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{lead.contactName}</p>
                      <p className="text-xs text-on-surface-variant">{lead.company}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase', stageStyles[lead.stage])}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface">{formatBudget(lead.budget)}</td>
                    <td className="px-4 py-3 text-right">
                      <StatusDot status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bv-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant">
            <h2 className="text-title-md font-semibold text-on-background">Activity timeline</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Merged from Sales Activity</p>
          </div>
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin p-4 space-y-6">
            {Object.entries(activityGroups).map(([dateGroup, items]) => (
              <section key={dateGroup}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">{dateGroup}</h3>
                <ul className="space-y-3">
                  {items.map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      <span className="mt-0.5 w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">{typeIcon[a.type] ?? 'circle'}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-on-surface">{a.title}</p>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{a.body}</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          {a.actor} · {a.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-title-md font-semibold text-on-background">Top Clients</h2>
          <button type="button" className="text-label-sm text-secondary font-semibold hover:underline" onClick={() => navigate({ to: '/sales/clients' })}>
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {topClients.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-outline-variant hover:border-secondary card-hover cursor-pointer"
              onClick={() => navigate({ to: '/sales/clients/$clientId', params: { clientId: c.id } })}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-sm font-bold">
                  {c.logoInitials ?? c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface truncate">{c.name}</p>
                  <p className="text-xs text-on-surface-variant">{c.industry}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <StatusDot status={c.status} />
                <span className="text-xs text-on-surface-variant">
                  {c.projects} projects · {c.leads} leads
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
