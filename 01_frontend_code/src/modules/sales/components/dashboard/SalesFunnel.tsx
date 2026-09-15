import { cn } from '@/shared/lib/cn'
import { stageColors } from '../../schemas/enums'

type StageCount = { stage: string; count: number }

type Props = {
  stageCounts: StageCount[]
  maxFunnel: number
}

/** Horizontal funnel bars by pipeline stage. */
export function SalesFunnel({ stageCounts, maxFunnel }: Props) {
  const safe = stageCounts ?? []
  const max = Math.max(maxFunnel, 1)

  return (
    <section className="bv-surface card-hover p-6">
      <h2 className="text-title-md font-semibold mb-5">Sales funnel</h2>
      <div className="space-y-3">
        {safe.map(({ stage, count }) => (
          <div key={stage}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-on-surface">{stage}</span>
              <span className="text-on-surface-variant">{count}</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', stageColors[String(stage)] ?? 'bg-secondary')}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
