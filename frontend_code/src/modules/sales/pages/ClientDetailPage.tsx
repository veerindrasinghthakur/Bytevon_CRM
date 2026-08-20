import { Link, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { clients, salesActivities } from '../data/mock'
import type { ClientType, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const typeStyles: Record<ClientType, string> = {
  Enterprise: 'bg-secondary/10 text-secondary',
  SMB: 'bg-sky-100 text-sky-800',
  Partner: 'bg-amber-100 text-amber-800',
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

function formatMoney(n?: number) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const activityIcon: Record<string, string> = {
  'Lead Created': 'person_add',
  'Lead Won': 'emoji_events',
  'Meeting Scheduled': 'event',
  'Email Sent': 'mail',
  Call: 'call',
  'Document Viewed': 'description',
  'System Alert': 'warning',
  'Contract Renewed': 'autorenew',
  'Proposal Sent': 'send',
}

export function ClientDetailPage() {
  const { clientId } = useParams({ strict: false }) as { clientId: string }
  const client = clients.find((c) => c.id === clientId) ?? clients.find((c) => c.name.includes('Nexus')) ?? clients[0]

  if (!client) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Client not found" showBack backTo="/sales/clients" backLabel="Back to clients" />
      </div>
    )
  }

  const timeline = salesActivities.slice(0, 4)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={client.name}
        description={client.legalName ?? client.industry}
        showBack
        backTo="/sales/clients"
        backLabel="Back to clients"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link to="/sales/clients" className="hover:text-secondary">
              Clients
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{client.name}</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-3 flex-wrap">
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
            <Button variant="outline" leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}>
              Edit Client
            </Button>
            <Button variant="primary" leftIcon={<span className="material-symbols-outlined text-lg">add</span>}>
              Add Project
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight', typeStyles[client.type])}>
          {client.type}
        </span>
        <StatusDot status={client.status} />
        <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm">
          <span className="material-symbols-outlined text-lg">public</span>
          {client.country}
        </div>
        {client.website && (
          <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm">
            <span className="material-symbols-outlined text-lg">language</span>
            <a href={`https://${client.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:text-secondary transition-colors">
              {client.website}
            </a>
          </div>
        )}
      </div>

      {/* KPI row — matches client details UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bv-surface card-hover p-5 transition-transform hover:-translate-y-0.5">
          <p className="text-label-md text-on-surface-variant mb-1">Total Projects</p>
          <h3 className="text-headline-md font-bold text-on-surface">{client.projects}</h3>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
            <span className="material-symbols-outlined text-xs">trending_up</span> +2 this quarter
          </div>
        </div>
        <div className="bv-surface card-hover p-5 transition-transform hover:-translate-y-0.5">
          <p className="text-label-md text-on-surface-variant mb-1">Active Leads</p>
          <h3 className="text-headline-md font-bold text-on-surface">{client.leads}</h3>
          <div className="flex items-center gap-1 mt-2 text-on-surface-variant text-xs font-bold">
            <span className="material-symbols-outlined text-xs">remove</span> Stable
          </div>
        </div>
        <div className="bv-surface card-hover p-5 transition-transform hover:-translate-y-0.5">
          <p className="text-label-md text-on-surface-variant mb-1">Total Revenue</p>
          <h3 className="text-headline-md font-bold text-on-surface">{formatMoney(client.arr ?? client.revenue)}</h3>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
            <span className="material-symbols-outlined text-xs">trending_up</span> {client.growth ?? '+14% YoY'}
          </div>
        </div>
        <div className="bv-surface card-hover p-5 transition-transform hover:-translate-y-0.5">
          <p className="text-label-md text-on-surface-variant mb-1">Client Since</p>
          <h3 className="text-headline-md font-bold text-on-surface">{client.clientSince ?? '—'}</h3>
          {client.clientSince && <p className="text-on-surface-variant text-xs font-bold mt-2">Tenure</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Activity timeline */}
        <div className="lg:col-span-1 bv-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-md font-semibold text-on-surface">Latest Activity</h3>
            <Link to="/sales/dashboard" className="text-secondary text-sm font-semibold hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-0 relative">
            {timeline.map((a, idx) => (
              <div key={a.id} className={cn('relative flex gap-4', idx < timeline.length - 1 && 'pb-8')}>
                {idx < timeline.length - 1 && (
                  <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-outline-variant" aria-hidden />
                )}
                <div className="z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary/15 text-secondary">
                  <span className="material-symbols-outlined text-xs">{activityIcon[a.type] ?? 'circle'}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-medium text-sm text-on-surface">{a.title}</p>
                  <p className="text-body-sm text-on-surface-variant opacity-80 mt-0.5 line-clamp-2">{a.body}</p>
                  <p className="text-xs text-on-surface-variant mt-2 font-medium">
                    {a.time} · {a.dateGroup.split(',')[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Information */}
        <div className="bv-surface p-6">
          <h3 className="text-title-md font-semibold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">info</span> Company Information
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Full Legal Name</dt>
              <dd className="text-body-md text-on-surface">{client.legalName ?? client.name}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Industry</dt>
                <dd className="text-body-md text-on-surface">{client.industry}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Sector</dt>
                <dd className="text-body-md text-on-surface">{client.sector ?? '—'}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tax ID</dt>
                <dd className="text-body-md text-on-surface">{client.taxId ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Founding Date</dt>
                <dd className="text-body-md text-on-surface">{client.founded ?? '—'}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Primary contact</dt>
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

        {/* Headquarters */}
        <div className="bv-surface p-6 flex flex-col overflow-hidden">
          <h3 className="text-title-md font-semibold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">location_on</span> Headquarters
          </h3>
          <p className="text-body-md text-on-surface mb-4 whitespace-pre-line">
            {client.address ?? `${client.country}`}
          </p>
          <div className="flex-1 min-h-[140px] relative mt-2 rounded-lg bg-surface-container-highest overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center border-2 border-secondary">
                <div className="w-4 h-4 bg-secondary rounded-full" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-surface-container-lowest shadow-md text-xs font-bold rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">open_in_new</span> Directions
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
