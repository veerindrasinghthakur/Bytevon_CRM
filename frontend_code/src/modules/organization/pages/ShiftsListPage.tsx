import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getShifts } from '../api/organization'
import type { ShiftRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

export function ShiftsListPage() {
  const [items, setItems] = useState<ShiftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getShifts({ includeArchived: true })
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <PageLoadingSkeleton />
  if (error) return <ErrorState description={error} onRetry={load} />

  return (
    <div className="space-y-6">
      <PageHeader title="Shifts" description="Working shift templates used on employment assignments" />
      {items.length === 0 ? (
        <EmptyState title="No shifts" description="Create a shift to assign employees." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <div
              key={s.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-title-md font-semibold text-on-background">{s.name}</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                    {s.is_overnight ? ' · Overnight' : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                    s.is_archived ? 'bg-surface-container text-on-surface-variant' : 'bg-secondary/15 text-secondary',
                  )}
                >
                  {s.is_archived ? 'ARCHIVED' : 'ACTIVE'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-body-sm">
                <div>
                  <p className="text-label-sm text-on-surface-variant">Grace</p>
                  <p className="font-medium">{s.grace_late_minutes} min</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Break</p>
                  <p className="font-medium">{s.break_duration_minutes ?? '—'} min</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Flexible end</p>
                  <p className="font-medium">{s.flexible_end ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
