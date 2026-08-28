import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useLead, useSalesActivities } from '../hooks/use-sales'
import { salesRoutes } from '../routes'
import type { PipelineStage, LeadPriority, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'
import { stageStyles, priorityStyles, activityIcon } from '../schemas/cssTokens'

const STAGES: PipelineStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
]

function StatusDot({ status }: { status: RecordStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold',
        status === 'Active' ? 'text-emerald-700' : 'text-slate-500',
      )}
    >
      <span
        className={cn(
          'w-2.5 h-2.5 rounded-full',
          status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
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

export function LeadDetailPage() {
  const navigate = useNavigate()
  const { leadId } = useParams({ strict: false }) as { leadId: string }
  const leadQuery = useLead(leadId)
  const activitiesQuery = useSalesActivities()
  const lead = leadQuery.data ?? null
  const timeline = (activitiesQuery.data ?? []).slice(0, 4)

  if (leadQuery.isLoading) return <PageLoadingSkeleton />

  if (leadQuery.isError || !lead) {
    return (
      <ErrorState
        title="Lead not found"
        description="This lead could not be loaded."
        onRetry={() => void leadQuery.refetch()}
        onBack={() => safeNavigate(navigate, { to: salesRoutes.leads })}
      />
    )
  }

  const currentIdx = STAGES.indexOf(lead.stage)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={lead.title}
        description={`${lead.contactName}${lead.contactTitle ? ` · ${lead.contactTitle}` : ''} at ${lead.company}`}
        showBack
        backTo={salesRoutes.leads}
        backLabel="Back to leads"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={salesRoutes.root} className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link to={salesRoutes.leads} className="hover:text-secondary">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary/30 text-secondary font-semibold text-sm hover:bg-secondary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Open chat
              </a>
            )}
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
              onClick={() =>
                safeNavigate(navigate, {
                  to: salesRoutes.leadEdit(lead.id),
                  params: { leadId: lead.id },
                })
              }
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
        <span className={cn('text-[11px] font-bold uppercase', priorityStyles[lead.priority])}>
          {lead.priority}
        </span>
        <StatusDot status={lead.status} />
        <span className="text-xs text-on-surface-variant font-mono">{lead.id}</span>
      </div>

      <div className="bv-surface p-5">
        <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-4">Pipeline stage</p>
        <div className="flex flex-wrap items-center gap-2">
          {STAGES.filter((s) => s !== 'Lost').map((stage, i) => {
            const done = currentIdx >= i && lead.stage !== 'Lost'
            const active = lead.stage === stage
            return (
              <div key={stage} className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors',
                    active
                      ? stageStyles[stage]
                      : done
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-surface-container text-on-surface-variant',
                  )}
                >
                  {stage}
                </span>
                {i < STAGES.filter((s) => s !== 'Lost').length - 1 && (
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">
                    chevron_right
                  </span>
                )}
              </div>
            )
          })}
          {lead.stage === 'Lost' && (
            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase', stageStyles.Lost)}>
              Lost
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <h2 className="text-title-md font-semibold mb-4">Contact & company</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Contact</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.contactName}</dd>
                {lead.contactTitle && (
                  <dd className="text-xs text-on-surface-variant">{lead.contactTitle}</dd>
                )}
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Company</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.company}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Industry</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.industry ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Source</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.source}</dd>
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
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Assigned</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.assignedTo ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Created</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{lead.createdAt}</dd>
              </div>
            </dl>
          </section>

          {lead.notes && (
            <section className="bv-surface p-6">
              <h2 className="text-title-md font-semibold mb-3">Internal notes</h2>
              <p className="text-body-md text-on-surface italic">"{lead.notes}"</p>
            </section>
          )}

          <section className="bv-surface p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-md font-semibold">Activity</h2>
              <Link to={salesRoutes.activity} className="text-secondary text-sm font-semibold hover:underline">
                Full timeline
              </Link>
            </div>
            <div className="space-y-0 relative">
              {timeline.map((a, idx) => (
                <div key={a.id} className={cn('relative flex gap-4', idx < timeline.length - 1 && 'pb-6')}>
                  {idx < timeline.length - 1 && (
                    <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-outline-variant" aria-hidden />
                  )}
                  <div className="z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary/15 text-secondary">
                    <span className="material-symbols-outlined text-xs">
                      {activityIcon[a.type] ?? 'circle'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-on-surface">{a.title}</p>
                    <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{a.body}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {a.actor} · {a.time}
                    </p>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-body-sm text-on-surface-variant">No recent activity.</p>
              )}
            </div>
          </section>

          {lead.chatLink && (
            <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 executive-shadow">
              <h2 className="text-title-md font-semibold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">chat</span>
                Client chat
              </h2>
              <a
                href={lead.chatLink}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-semibold text-sm hover:underline inline-flex items-center gap-2"
              >
                {lead.chatLink}
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="bv-surface p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">Estimated value</p>
            <p className="text-2xl font-bold text-on-background mt-1">{formatBudget(lead.budget)}</p>
          </div>
          <div className="bv-surface p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">Expected close</p>
            <p className="text-lg font-semibold text-on-background mt-1">{lead.date ?? '—'}</p>
          </div>
          {lead.probability != null && (
            <div className="bv-surface p-5">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">Win probability</p>
              <p className="text-lg font-semibold text-on-background mt-1">{lead.probability}%</p>
              <div className="mt-2 h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${Math.min(100, lead.probability)}%` }}
                />
              </div>
            </div>
          )}
          {lead.tags && lead.tags.length > 0 && (
            <div className="bv-surface p-5">
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
          {lead.caseStudy && (
            <div className="bv-surface p-5">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Related case study</p>
              <p className="font-semibold text-secondary text-sm">{lead.caseStudy}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
