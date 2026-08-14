import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import {
  dashboardMetrics,
  leads,
  clients,
  salesActivities,
} from '../data/mock'
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

function StatusDot({ status }: { status: RecordStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold',
        status === 'Active' ? 'text-emerald-700' : 'text-slate-500'
      )}
    >
      <span
        className={cn(
          'w-2.5 h-2.5 rounded-full',
          status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
        )}
      />
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
  const recentLeads = leads.slice(0, 5)
  const topClients = clients.filter((c) => c.status === 'Active').slice(0, 4)
  const recentActivity = salesActivities.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Dashboard"
        description="Pipeline health, recent leads, and client activity at a glance."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              leftIcon={<span className="material-symbols-outlined text-lg">person_search</span>}
              onClick={() => navigate({ to: '/sales/leads' })}
            >
              View Leads
            </Button>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
              onClick={() => navigate({ to: '/sales/leads/new' })}
            >
              New Lead
            </Button>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow"
          >
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
            {m.subtitle && (
              <p className="text-[11px] mt-1 text-on-surface-variant">{m.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent leads */}
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-background">Recent Leads</h2>
            <button
              type="button"
              className="text-label-sm text-secondary font-semibold hover:underline"
              onClick={() => navigate({ to: '/sales/leads' })}
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                    onClick={() => navigate({ to: '/sales/leads' })}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{lead.contactName}</p>
                      <p className="text-xs text-on-surface-variant">{lead.company}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          stageStyles[lead.stage]
                        )}
                      >
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {formatBudget(lead.budget)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusDot status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-background">Activity</h2>
            <button
              type="button"
              className="text-label-sm text-secondary font-semibold hover:underline"
              onClick={() => navigate({ to: '/sales/activity' })}
            >
              Timeline
            </button>
          </div>
          <ul className="divide-y divide-outline-variant">
            {recentActivity.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">
                      {a.type.includes('Won')
                        ? 'emoji_events'
                        : a.type.includes('Meeting')
                          ? 'event'
                          : a.type.includes('Alert')
                            ? 'warning'
                            : 'person_add'}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-on-surface">{a.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{a.body}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      {a.actor} · {a.time}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-title-md font-semibold text-on-background">Top Clients</h2>
          <button
            type="button"
            className="text-label-sm text-secondary font-semibold hover:underline"
            onClick={() => navigate({ to: '/sales/clients' })}
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {topClients.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-outline-variant hover:border-secondary/40 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate({ to: '/sales/clients' })}
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

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Leads', icon: 'person_search', to: '/sales/leads' },
          { label: 'Clients', icon: 'handshake', to: '/sales/clients' },
          { label: 'Analytics', icon: 'analytics', to: '/sales/analytics' },
          { label: 'Activity', icon: 'timeline', to: '/sales/activity' },
        ].map((link) => (
          <button
            key={link.to}
            type="button"
            onClick={() => navigate({ to: link.to })}
            className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-secondary/5 hover:border-secondary/30 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-secondary text-2xl">{link.icon}</span>
            <span className="font-semibold text-on-surface">{link.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
