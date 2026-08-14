import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { leads } from '../data/mock'
import type { PipelineStage, LeadPriority, RecordStatus } from '../types'
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

const priorityStyles: Record<LeadPriority, string> = {
  Critical: 'text-red-600',
  High: 'text-orange-600',
  Medium: 'text-amber-600',
  Low: 'text-slate-500',
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function LeadDetailPage() {
  const navigate = useNavigate()
  const { leadId } = useParams({ strict: false }) as { leadId: string }
  const lead = leads.find((l) => l.id === leadId) ?? leads[0]

  if (!lead) {
    return (
      <div>
        <PageHeader title="Lead not found" showBack backTo="/sales/leads" backLabel="Back to leads" />
        <p className="text-body-md text-on-surface-variant">This lead does not exist in mock data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.title}
        description={`${lead.contactName}${lead.contactTitle ? ` · ${lead.contactTitle}` : ''} at ${lead.company}`}
        showBack
        backTo="/sales/leads"
        backLabel="Back to leads"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link to="/sales/leads" className="hover:text-secondary">
              Leads
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{lead.id}</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-3">
            {lead.chatLink && (
              <a
                href={lead.chatLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary/30 text-secondary font-semibold text-sm hover:bg-secondary/5"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Open chat
              </a>
            )}
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
              onClick={() => navigate({ to: '/sales/leads/$leadId/edit', params: { leadId: lead.id } })}
            >
              Edit lead
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase', stageStyles[lead.stage])}>
          {lead.stage}
        </span>
        <span className={cn('text-[11px] font-bold uppercase', priorityStyles[lead.priority])}>{lead.priority}</span>
        <StatusDot status={lead.status} />
        <span className="text-xs text-on-surface-variant font-mono">{lead.id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="text-title-md font-semibold mb-4">Overview</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Company</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.company}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Industry</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.industry ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Email</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Phone</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Source</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.source}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Assigned</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.assignedTo ?? 'Unassigned'}</dd>
              </div>
            </dl>
          </section>

          {lead.notes && (
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
              <h2 className="text-title-md font-semibold mb-3">Internal notes</h2>
              <p className="text-body-md text-on-surface italic">"{lead.notes}"</p>
            </section>
          )}

          {lead.chatLink && (
            <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6">
              <h2 className="text-title-md font-semibold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">chat</span>
                Client chat
              </h2>
              <a href={lead.chatLink} target="_blank" rel="noreferrer" className="text-secondary font-semibold text-sm hover:underline inline-flex items-center gap-2">
                {lead.chatLink}
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">Estimated value</p>
            <p className="text-2xl font-bold text-on-background mt-1">{formatBudget(lead.budget)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">Date</p>
            <p className="text-lg font-semibold text-on-background mt-1">{lead.date ?? '—'}</p>
          </div>
          {lead.probability != null && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">Probability</p>
              <p className="text-lg font-semibold text-on-background mt-1">{lead.probability}%</p>
            </div>
          )}
          {lead.tags && lead.tags.length > 0 && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((t) => (
                  <span key={t} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
