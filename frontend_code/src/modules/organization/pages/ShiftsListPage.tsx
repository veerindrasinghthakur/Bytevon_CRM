import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getShifts } from '../api/organization'
import type { ShiftRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

export function ShiftsListPage() {
  const navigate = useNavigate()
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Shifts</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Working shift templates used on employment assignments
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
          onClick={() => navigate({ to: '/admin/settings/shifts/new' })}
        >
          Add shift
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No shifts"
          description="Create a shift to assign employees."
          actionLabel="Add shift"
          onAction={() => navigate({ to: '/admin/settings/shifts/new' })}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                navigate({
                  to: '/admin/settings/shifts/$shiftId',
                  params: { shiftId: String(s.id) },
                })
              }
              className="text-left bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover cursor-pointer"
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
                    s.is_archived
                      ? 'bg-surface-container text-on-surface-variant'
                      : 'bg-secondary/15 text-secondary',
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
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
