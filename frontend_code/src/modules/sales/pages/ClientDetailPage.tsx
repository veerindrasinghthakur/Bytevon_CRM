import { Link, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { clients } from '../data/mock'
import type { ClientType, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const typeStyles: Record<ClientType, string> = {
  Enterprise: 'bg-violet-100 text-violet-800',
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

export function ClientDetailPage() {
  const { clientId } = useParams({ strict: false }) as { clientId: string }
  const client = clients.find((c) => c.id === clientId) ?? clients[0]

  if (!client) {
    return (
      <div>
        <PageHeader title="Client not found" showBack backTo="/sales/clients" backLabel="Back to clients" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          client.chatLink ? (
            <a
              href={client.chatLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary/30 text-secondary font-semibold text-sm hover:bg-secondary/5"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              Open chat
            </a>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase', typeStyles[client.type])}>
          {client.type}
        </span>
        <StatusDot status={client.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="text-title-md font-semibold mb-4">Account details</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Industry</dt>
              <dd className="font-semibold mt-0.5">{client.industry}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Country</dt>
              <dd className="font-semibold mt-0.5">{client.country}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Primary contact</dt>
              <dd className="font-semibold mt-0.5">{client.primaryContact ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Email</dt>
              <dd className="font-semibold mt-0.5">{client.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Phone</dt>
              <dd className="font-semibold mt-0.5">{client.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Website</dt>
              <dd className="font-semibold mt-0.5">{client.website ?? '—'}</dd>
            </div>
            {client.address && (
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Address</dt>
                <dd className="font-semibold mt-0.5">{client.address}</dd>
              </div>
            )}
            {client.clientSince && (
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Client since</dt>
                <dd className="font-semibold mt-0.5">{client.clientSince}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
            <p className="text-[10px] font-bold uppercase text-on-surface-variant">ARR / Revenue</p>
            <p className="text-2xl font-bold mt-1">{formatMoney(client.arr ?? client.revenue)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">Projects</p>
              <p className="text-xl font-bold mt-1">{client.projects}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">Leads</p>
              <p className="text-xl font-bold mt-1">{client.leads}</p>
            </div>
          </div>
          {client.chatLink && (
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-5">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-2">Chat</p>
              <a href={client.chatLink} target="_blank" rel="noreferrer" className="text-secondary text-sm font-semibold hover:underline break-all">
                {client.chatLink}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
