import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftDays, setDraftDays] = useState<number[]>([])

  useEffect(() => {
    getWorkingWeeks()
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoadingSkeleton />
  if (error) return <ErrorState description={error} />

  const startEdit = (w: WorkingWeekRow) => {
    setEditingId(w.id)
    setDraftDays([...w.working_days_of_week])
  }

  const toggleDay = (i: number) => {
    setDraftDays((days) =>
      days.includes(i) ? days.filter((d) => d !== i) : [...days, i].sort((a, b) => a - b),
    )
  }

  const save = (id: number) => {
    setItems((list) =>
      list.map((w) => (w.id === id ? { ...w, working_days_of_week: draftDays } : w)),
    )
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title-lg font-semibold text-on-background">Working weeks</h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Versioned weekly schedules (effective dating — previous versions are never overwritten)
        </p>
      </div>
      <div className="space-y-4">
        {items.map((w) => {
          const editing = editingId === w.id
          const days = editing ? draftDays : w.working_days_of_week
          return (
            <div
              key={w.id}
              className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-title-md font-semibold">{w.name}</h3>
                  <span className="text-label-sm text-on-surface-variant">
                    {w.effective_from} → {w.effective_to ?? 'present'}
                  </span>
                </div>
                {editing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => save(w.id)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
                    onClick={() => startEdit(w)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {DAY.map((d, i) => {
                  const on = days.includes(i)
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={!editing}
                      onClick={() => editing && toggleDay(i)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-label-sm font-medium border transition-colors',
                        on
                          ? 'bg-secondary/15 text-secondary border-secondary/20'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant',
                        editing && 'cursor-pointer hover:border-secondary',
                        !editing && 'cursor-default',
                      )}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
