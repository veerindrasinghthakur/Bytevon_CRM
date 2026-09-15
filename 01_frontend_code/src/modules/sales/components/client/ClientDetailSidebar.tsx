import type { Client } from '../../types'

function formatMoney(n?: number) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

type Props = {
  client: Client
}

/** ARR / projects / leads / tags sidebar cards. */
export function ClientDetailSidebar({ client }: Props) {
  return (
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
        <p className="text-2xl font-bold text-on-background mt-1">
          {formatMoney(client.arr ?? client.revenue)}
        </p>
        {client.growth && <p className="text-xs text-secondary font-semibold mt-1">{client.growth}</p>}
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
  )
}
