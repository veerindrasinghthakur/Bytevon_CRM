import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getWorkingWeeks } from '../api/organization'
import type { WorkingWeekRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WorkingWeeksPage() {
  const [items, setItems] = useState<WorkingWeekRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getWorkingWeeks()
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoadingSkeleton />
  if (error) return <ErrorState description={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Working weeks"
        description="Versioned weekly schedules (effective dating — previous versions are never overwritten)"
      />
      <div className="space-y-4">
        {items.map((w) => (
          <div
            key={w.id}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-title-md font-semibold">{w.name}</h3>
              <span className="text-label-sm text-on-surface-variant">
                {w.effective_from} → {w.effective_to ?? 'present'}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {DAY.map((d, i) => {
                const on = w.working_days_of_week.includes(i)
                return (
                  <span
                    key={d}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-label-sm font-medium border',
                      on
                        ? 'bg-secondary/15 text-secondary border-secondary/20'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant',
                    )}
                  >
                    {d}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
