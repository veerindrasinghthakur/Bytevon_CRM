import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { StatusDot } from '@/shared/components/ui/StatusDot'
import { useLead, useSalesActivities, useUpdateLead } from '../../hooks/use-sales'
import { salesRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'
import { stageStyles, priorityStyles } from '../../schemas/enums'
import { LeadPipelineBar } from '../../components/lead/LeadPipelineBar'
import { LeadContactSection } from '../../components/lead/LeadContactSection'
import { LeadActivitySection } from '../../components/lead/LeadActivitySection'
import { LeadDetailSidebar } from '../../components/lead/LeadDetailSidebar'

export function LeadDetailPage() {
  const navigate = useNavigate()
  const { leadId } = useParams({ strict: false }) as { leadId: string }
  const leadQuery = useLead(leadId)
  const activitiesQuery = useSalesActivities()
  const updateLead = useUpdateLead()
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
            <Link {...looseLinkProps({ to: salesRoutes.root, className: 'hover:text-secondary' })}>
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link {...looseLinkProps({ to: salesRoutes.leads, className: 'hover:text-secondary' })}>
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

      <LeadPipelineBar
        leadId={lead.id}
        stage={lead.stage}
        updateLead={updateLead}
        onRefetch={() => leadQuery.refetch()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadContactSection lead={lead} />

          {lead.notes && (
            <section className="bv-surface p-6">
              <h2 className="text-title-md font-semibold mb-3">Internal notes</h2>
              <p className="text-body-md text-on-surface italic">&ldquo;{lead.notes}&rdquo;</p>
            </section>
          )}

          <LeadActivitySection timeline={timeline} />

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

        <LeadDetailSidebar lead={lead} />
      </div>
    </div>
  )
}
