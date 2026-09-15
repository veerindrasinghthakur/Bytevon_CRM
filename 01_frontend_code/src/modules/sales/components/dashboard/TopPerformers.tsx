function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

type Performer = {
  name: string
  role: string
  value: number
  deals: number
  winRate: string
}

type Props = {
  topPerformers: Performer[]
}

/** Ranked sales rep list. */
export function TopPerformers({ topPerformers }: Props) {
  const safe = topPerformers ?? []

  return (
    <section className="bv-surface card-hover p-6">
      <h2 className="text-title-md font-semibold mb-5">Top performers</h2>
      <ul className="space-y-3">
        {safe.map((p, i) => (
          <li
            key={p.name}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-sm font-bold shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-on-surface truncate">{p.name}</p>
              <p className="text-xs text-on-surface-variant">{p.role}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-on-background">{formatBudget(p.value)}</p>
              <p className="text-[10px] text-on-surface-variant">
                {p.deals} deals · {p.winRate}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
