import { StatusDot } from '@/shared/components/ui/StatusDot'

type ClientCard = {
  id: string
  name: string
  industry?: string
  status: string
  projects: number
  leads: number
  logoInitials?: string
}

type Props = {
  topClients: ClientCard[]
  onViewAll: () => void
  onOpenClient: (clientId: string) => void
}

/** Top clients card grid. */
export function TopClientsGrid({ topClients, onViewAll, onOpenClient }: Props) {
  const safe = topClients ?? []

  return (
    <div className="bv-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
        <h2 className="text-title-md font-semibold text-on-background">Top Clients</h2>
        <button
          type="button"
          className="text-label-sm text-secondary font-semibold hover:underline"
          onClick={onViewAll}
        >
          View all
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
        {safe.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-xl border border-outline-variant hover:border-secondary card-hover cursor-pointer"
            onClick={() => onOpenClient(c.id)}
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
              <StatusDot status={c.status as 'Active' | 'Inactive'} />
              <span className="text-xs text-on-surface-variant">
                {c.projects} projects · {c.leads} leads
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
