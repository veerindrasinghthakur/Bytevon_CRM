import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useWorkingWeeksList } from '../hooks/use-organization'
import type { WorkingWeekRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKS_QK = ['organization', 'working-weeks'] as const

export function WorkingWeeksPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useWorkingWeeksList()
  const items = data?.items ?? []
  // Client form state only while editing one row — never a local copy of the list
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftDays, setDraftDays] = useState<number[]>([])

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  const startEdit = (w: WorkingWeekRow) => {
    setEditingId(w.id)
    setDraftDays([...w.working_days_of_week])
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraftDays([])
  }

  const toggleDay = (i: number) => {
    setDraftDays((days) =>
      days.includes(i) ? days.filter((d) => d !== i) : [...days, i].sort((a, b) => a - b),
    )
  }

  // Optimistic update via Query cache (server state) — no localItems mirror
  const save = (id: number) => {
    qc.setQueryData(WEEKS_QK, (prev: { items: WorkingWeekRow[]; total: number } | undefined) => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map((w) =>
          w.id === id ? { ...w, working_days_of_week: draftDays } : w,
        ),
      }
    })
    setEditingId(null)
    setDraftDays([])
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => save(w.id)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <EditButton variant="outline" onClick={() => startEdit(w)} />
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
