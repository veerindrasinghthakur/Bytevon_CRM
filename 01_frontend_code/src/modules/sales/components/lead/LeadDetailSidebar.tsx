import type { Lead } from '../../types'

function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

type Props = {
  lead: Lead
}

/** Value / close date / probability / tags / case study cards. */
export function LeadDetailSidebar({ lead }: Props) {
  return (
    <div className="space-y-4">
      <div className="bv-surface p-5">
        <p className="text-[10px] font-bold uppercase text-on-surface-variant">Estimated value</p>
        <p className="text-2xl font-bold text-on-background mt-1">{formatBudget(lead.budget)}</p>
      </div>
      <div className="bv-surface p-5">
        <p className="text-[10px] font-bold uppercase text-on-surface-variant">Expected close</p>
        <p className="text-lg font-semibold text-on-background mt-1">{lead.date ?? '—'}</p>
      </div>
      <div className="bv-surface p-5">
        <p className="text-[10px] font-bold uppercase text-on-surface-variant">Project auto-create</p>
        <p className="text-lg font-semibold text-on-background mt-1">
          {lead.autoCreateProject ? 'On (creates on WON)' : 'Off'}
        </p>
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
      {lead.caseStudy && (
        <div className="bv-surface p-5">
          <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">
            Related case study
          </p>
          <p className="font-semibold text-secondary text-sm">{lead.caseStudy}</p>
        </div>
      )}
    </div>
  )
}
