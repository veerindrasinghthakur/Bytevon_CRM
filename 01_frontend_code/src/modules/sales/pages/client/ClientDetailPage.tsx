import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { Can } from '@/shared/rbac'
import { StatusDot } from '@/shared/components/ui/StatusDot'
import { useClient, useSalesActivities } from '../../hooks/use-sales'
import { salesRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'
import { typeStyles } from '../../schemas/enums'
import { ClientOverviewSection } from '../../components/client/ClientOverviewSection'
import { ClientContactSection } from '../../components/client/ClientContactSection'
import { ClientActivitySection } from '../../components/client/ClientActivitySection'
import { ClientDetailSidebar } from '../../components/client/ClientDetailSidebar'

export function ClientDetailPage() {
  const navigate = useNavigate()
  const { clientId } = useParams({ strict: false }) as { clientId: string }
  const clientQuery = useClient(clientId)
  const activitiesQuery = useSalesActivities()
  const client = clientQuery.data ?? null
  const timeline = (activitiesQuery.data ?? []).slice(0, 4)

  useDeletedRedirect({ ready: !clientQuery.isLoading, data: client, error: clientQuery.error, listTo: salesRoutes.clients })

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
            <Can action="UPDATE" resource="client">
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
            </Can>
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
          <ClientOverviewSection client={client} />
          <ClientContactSection client={client} />
          <ClientActivitySection timeline={timeline} />

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

        <ClientDetailSidebar client={client} />
      </div>
    </div>
  )
}
