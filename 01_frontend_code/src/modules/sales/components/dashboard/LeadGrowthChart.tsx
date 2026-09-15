type MonthPoint = { month: string; leads: number }

type Props = {
  monthlyGrowth: MonthPoint[]
  maxGrowth: number
}

/** Bar chart of new leads by month. */
export function LeadGrowthChart({ monthlyGrowth, maxGrowth }: Props) {
  const safe = monthlyGrowth ?? []
  const max = Math.max(maxGrowth, 1)

  return (
    <section className="bv-surface card-hover p-6">
      <h2 className="text-title-md font-semibold mb-1">Monthly lead growth</h2>
      <p className="text-body-sm text-on-surface-variant mb-5">New leads by month (last 6)</p>
      <div className="flex items-end gap-3 h-36">
        {safe.map((m) => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-[10px] font-semibold text-on-surface-variant">{m.leads}</span>
            <div
              className="w-full rounded-t-md bg-secondary/80 hover:bg-secondary transition-colors min-h-[4px]"
              style={{ height: `${(m.leads / max) * 100}%` }}
              title={`${m.month}: ${m.leads} leads`}
            />
            <span className="text-[10px] font-medium text-on-surface-variant">{m.month}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
