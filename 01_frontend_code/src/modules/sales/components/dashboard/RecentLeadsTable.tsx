import { StatusDot } from '@/shared/components/ui/StatusDot'
import { cn } from '@/shared/lib/cn'
import { stageStyles } from '../../schemas/enums'

function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

type LeadRow = {
  id: string
  contactName: string
  company?: string
  stage: string
  budget: number
  status: 'Active' | 'Inactive' | string
}

type Props = {
  recentLeads: LeadRow[]
  onViewAll: () => void
  onOpenLead: (leadId: string) => void
}

/** Compact recent leads table. */
export function RecentLeadsTable({ recentLeads, onViewAll, onOpenLead }: Props) {
  const safe = recentLeads ?? []

  return (
    <div className="xl:col-span-2 bv-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
        <h2 className="text-title-md font-semibold text-on-background">Recent Leads</h2>
        <button
          type="button"
          className="text-label-sm text-secondary font-semibold hover:underline"
          onClick={onViewAll}
        >
          View all
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low/50">
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Lead
              </th>
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Stage
              </th>
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {safe.map((lead) => (
              <tr
                key={lead.id}
                className="zebra-row cursor-pointer"
                onClick={() => onOpenLead(lead.id)}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-on-surface">{lead.contactName}</p>
                  <p className="text-xs text-on-surface-variant">{lead.company}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      stageStyles[String(lead.stage)] ?? 'status-badge status-neutral',
                    )}
                  >
                    {lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-on-surface">{formatBudget(lead.budget)}</td>
                <td className="px-4 py-3 text-right">
                  <StatusDot status={lead.status as 'Active' | 'Inactive'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
