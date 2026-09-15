function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

type Props = {
  pipelineValue: number
  avgDealSize: number
  wonCount: number
}

/** Pipeline / revenue summary cards. */
export function RevenueOverview({ pipelineValue, avgDealSize, wonCount }: Props) {
  return (
    <section className="bv-surface card-hover p-6">
      <h2 className="text-title-md font-semibold mb-1">Revenue overview</h2>
      <p className="text-body-sm text-on-surface-variant mb-5">Estimated pipeline and closed value</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-primary text-on-primary">
          <p className="text-xs text-on-primary/70 font-medium">Pipeline value</p>
          <p className="text-2xl font-bold mt-1">{formatBudget(pipelineValue)}</p>
          <p className="text-[11px] text-on-primary/60 mt-1">From active leads</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low">
          <p className="text-xs text-on-surface-variant font-medium">Est. revenue</p>
          <p className="text-2xl font-bold mt-1 text-on-background">{formatBudget(pipelineValue * 1.2)}</p>
          <p className="text-[11px] text-secondary font-semibold mt-1">+12% vs prior period</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low">
          <p className="text-xs text-on-surface-variant font-medium">Avg. deal size</p>
          <p className="text-xl font-bold mt-1">{formatBudget(avgDealSize)}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low">
          <p className="text-xs text-on-surface-variant font-medium">Won (sample)</p>
          <p className="text-xl font-bold mt-1 text-secondary">{wonCount}</p>
        </div>
      </div>
    </section>
  )
}
