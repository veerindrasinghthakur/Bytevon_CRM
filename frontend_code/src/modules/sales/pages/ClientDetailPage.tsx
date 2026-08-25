import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { ActivityFeed } from '@/shared/components/ui/ActivityFeed'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { StatusDot } from '@/shared/components/ui/StatusDot'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useClient, useSalesActivities } from '../hooks/use-sales'
import { salesRoutes } from '../routes'
import type { ClientType } from '../types'
import { cn } from '@/shared/lib/cn'

const typeStyles: Record<ClientType, string> = {
  Enterprise: 'bg-secondary/10 text-secondary',
  SMB: 'bg-sky-100 text-sky-800',
  Partner: 'bg-amber-100 text-amber-800',
}

function formatMoney(n?: number) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function ClientDetailPage() {
  const navigate = useNavigate()
  const { clientId } = useParams({ strict: false }) as { clientId: string }
  const { data: client, isLoading, isError, refetch, isFetching } = useClient(clientId)
  const { data: activities = [] } = useSalesActivities()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !client) {
    return (
      <div className="animate-fade-in text-center py-16 space-y-4">
        <PageHeader
          title="Client not found"
          showBack
          backTo={salesRoutes.clients}
          backLabel="Back to clients"
        />
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const timelineItems = activities.slice(0, 8).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.body,
    actor: a.actor,
    timestamp: `${a.time} · ${a.dateGroup.split(',')[0]}`,
    icon:
      a.type === 'Lead Won'
        ? 'emoji_events'
        : a.type === 'Meeting Scheduled'
          ? 'event'
          : a.type === 'Email Sent'
            ? 'mail'
            : 'history',
    badge: a.tag,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={client.name}
        description={client.legalName ?? client.industry}
        showBack
        backTo={salesRoutes.clients}
        backLabel="Back to clients"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={salesRoutes.root} className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link to={salesRoutes.clients} className="hover:text-secondary">
              Clients
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{client.name}</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <RefreshButton iconOnly onClick={() => void refetch()} isLoading={isFetching} />
            {client.chatLink && (
              <a
                href={client.chatLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary/30 text-secondary font-semibold text-sm hover:bg-secondary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Open chat
              </a>
            )}
            <EditButton
              label="Edit Client"
              onClick={() =>
                safeNavigate(navigate, {
                  to: '/sales/clients/$clientId/edit',
                  params: { clientId: client.id },
                })
              }
            />
            <Button variant="primary" leftIcon={<span className="material-symbols-outlined text-lg">add</span>}>
              Add Project
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight',
            typeStyles[client.type],
          )}
        >
          {client.type}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface">
          <StatusDot status={client.status} />
          {client.status}
        </span>
        <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm">
          <span className="material-symbols-outlined text-lg">public</span>
          {client.country}
        </div>
        {client.website && (
          <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm">
            <span className="material-symbols-outlined text-lg">language</span>
            <a
              href={`https://${client.website.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-secondary transition-colors"
            >
              {client.website}
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Projects" value={String(client.projects)} hint="+2 this quarter" positive />
        <Kpi label="Active Leads" value={String(client.leads)} hint="Stable" />
        <Kpi
          label="Total Revenue"
          value={formatMoney(client.arr ?? client.revenue)}
          hint={client.growth ?? '+14% YoY'}
          positive
        />
        <Kpi
          label="Client Since"
          value={client.clientSince ?? '—'}
          hint={client.clientSince ? 'Tenure' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bv-surface p-6">
          <h3 className="text-title-md font-semibold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">info</span> Company Information
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Full Legal Name
              </dt>
              <dd className="text-body-md text-on-surface">{client.legalName ?? client.name}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Industry
                </dt>
                <dd className="text-body-md text-on-surface">{client.industry}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Sector
                </dt>
                <dd className="text-body-md text-on-surface">{client.sector ?? '—'}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Tax ID
                </dt>
                <dd className="text-body-md text-on-surface">{client.taxId ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Founding Date
                </dt>
                <dd className="text-body-md text-on-surface">{client.founded ?? '—'}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Primary contact
              </dt>
              <dd className="text-body-md text-on-surface">{client.primaryContact ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email</dt>
              <dd className="text-body-md text-on-surface">{client.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Phone</dt>
              <dd className="text-body-md text-on-surface">{client.phone ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="bv-surface p-6 flex flex-col overflow-hidden">
          <h3 className="text-title-md font-semibold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">location_on</span> Headquarters
          </h3>
          <p className="text-body-md text-on-surface mb-4 whitespace-pre-line">
            {client.address ?? client.country}
          </p>
          <div className="flex-1 min-h-[140px] relative mt-2 rounded-lg bg-surface-container-highest overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center border-2 border-secondary">
                <div className="w-4 h-4 bg-secondary rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityFeed
        title="Activity timeline"
        items={timelineItems}
        variant="standard"
        headerAction={
          <Link to={salesRoutes.activity} className="text-secondary text-sm font-semibold hover:underline">
            View All
          </Link>
        }
      />
    </div>
  )
}

function Kpi({
  label,
  value,
  hint,
  positive,
}: {
  label: string
  value: string
  hint?: string
  positive?: boolean
}) {
  return (
    <div className="bv-surface card-hover p-5 transition-transform hover:-translate-y-0.5">
      <p className="text-label-md text-on-surface-variant mb-1">{label}</p>
      <h3 className="text-headline-md font-bold text-on-surface">{value}</h3>
      {hint && (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-bold',
            positive ? 'text-emerald-600' : 'text-on-surface-variant',
          )}
        >
          {positive && <span className="material-symbols-outlined text-xs">trending_up</span>}
          {hint}
        </div>
      )}
    </div>
  )
}
