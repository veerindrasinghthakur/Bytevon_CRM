import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { StatusDot } from '@/shared/components/ui/StatusDot'
import { useClient, useSalesActivities } from '../hooks/use-sales'
import { salesRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'
import { typeStyles, activityIcon } from '../schemas/cssTokens'

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
  const clientQuery = useClient(clientId)
  const activitiesQuery = useSalesActivities()
  const client = clientQuery.data ?? null
  const timeline = (activitiesQuery.data ?? []).slice(0, 4)

  if (clientQuery.isLoading) return <PageLoadingSkeleton />

  if (clientQuery.isError || !client) {
    return (
      <ErrorState
        title="Client not found"
        description="This client could not be loaded."
        onRetry={() => void clientQuery.refetch()}
        onBack={() => safeNavigate(navigate, { to: salesRoutes.clients })}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={client.name}
        description={[client.industry, client.country].filter(Boolean).join(' · ') || 'Client account'}
        showBack
        backTo={salesRoutes.clients}
        backLabel="Back to clients"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link {...looseLinkProps({ to: salesRoutes.root, className: 'hover:text-secondary' })}>
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link {...looseLinkProps({ to: salesRoutes.clients, className: 'hover:text-secondary' })}>
              Clients
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{client.id}</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-3">
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
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
              onClick={() =>
                safeNavigate(navigate, {
                  to: salesRoutes.clientEdit(client.id),
                  params: { clientId: client.id },
                })
              }
            >
              Edit client
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase', typeStyles[client.type])}>
          {client.type}
        </span>
        <StatusDot status={client.status} />
        <span className="text-xs text-on-surface-variant font-mono">{client.id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <h2 className="text-title-md font-semibold mb-4">Account overview</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Legal name</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.legalName ?? client.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Industry</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.industry ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Sector</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.sector ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Country</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.country ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Website</dt>
                <dd className="font-semibold text-on-surface mt-0.5">
                  {client.website ? (
                    <a
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary hover:underline"
                    >
                      {client.website}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Client since</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.clientSince ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Tax ID</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.taxId ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Founded</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.founded ?? '—'}</dd>
              </div>
              {client.address && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Address</dt>
                  <dd className="font-semibold text-on-surface mt-0.5">{client.address}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bv-surface p-6">
            <h2 className="text-title-md font-semibold mb-4">Primary contact</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Name</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.primaryContact ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Email</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Phone</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{client.phone ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="bv-surface p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-md font-semibold">Activity</h2>
              <Link
                {...looseLinkProps({
                  to: salesRoutes.activity,
                  className: 'text-secondary text-sm font-semibold hover:underline',
                })}
              >
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

          {client.chatLink && (
            <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 executive-shadow">
              <h2 className="text-title-md font-semibold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">chat</span>
                Client chat
              </h2>
              <a
                href={client.chatLink}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-semibold text-sm hover:underline inline-flex items-center gap-2"
              >
                {client.chatLink}
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="bv-surface p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-sm font-bold">
                {client.logoInitials ?? client.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">Account</p>
                <p className="font-semibold text-on-background">{client.name}</p>
              </div>
            </div>
          </div>
          <div className="bv-surface p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">ARR / Revenue</p>
            <p className="text-2xl font-bold text-on-background mt-1">{formatMoney(client.arr ?? client.revenue)}</p>
            {client.growth && (
              <p className="text-xs text-secondary font-semibold mt-1">{client.growth}</p>
            )}
          </div>
          <div className="bv-surface p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">Projects</p>
            <p className="text-lg font-semibold text-on-background mt-1">{client.projects}</p>
          </div>
          <div className="bv-surface p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">Leads</p>
            <p className="text-lg font-semibold text-on-background mt-1">{client.leads}</p>
          </div>
          {client.tags && client.tags.length > 0 && (
            <div className="bv-surface p-5">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {client.tags.map((t) => (
                  <span
                    key={t}
                    className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold"
                  >
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
