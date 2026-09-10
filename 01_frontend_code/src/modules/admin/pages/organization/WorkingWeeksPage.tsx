import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { ArchiveButton } from '@/shared/components/ui/ArchiveButton'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useWorkingWeeks } from '../../hooks/use-organization'
import { archiveWorkingWeek, createWorkingWeek } from '../../api/organization'
import type { WorkingWeekRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'
import { queryKeys } from '@/shared/lib/query-keys'
import { dayOptions as DAY } from '../../schemas/enums'

/** Normalize mock (monday:true) or schema (working_days_of_week:[0..6]) into day indexes. */
function toDayIndexes(w: WorkingWeekRow | Record<string, unknown>): number[] {
  const row = w as Record<string, unknown>
  if (Array.isArray(row.working_days_of_week)) {
    return (row.working_days_of_week as number[]).filter((d) => d >= 0 && d <= 6)
  }
  const map: [string, number][] = [
    ['monday', 0],
    ['tuesday', 1],
    ['wednesday', 2],
    ['thursday', 3],
    ['friday', 4],
    ['saturday', 5],
    ['sunday', 6],
  ]
  const days: number[] = []
  for (const [key, idx] of map) {
    if (row[key] === true) days.push(idx)
  }
  return days.length ? days : [0, 1, 2, 3, 4] // Mon–Fri default (0=Mon)
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function WorkingWeeksPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useWorkingWeeks()
  const items = useMemo(() => {
    const raw = data?.items ?? []
    return raw.map((w) => ({
      ...w,
      working_days_of_week: toDayIndexes(w as WorkingWeekRow),
      name: (w as WorkingWeekRow).name || 'Working week',
      effective_from: (w as WorkingWeekRow).effective_from || '—',
      effective_to: (w as WorkingWeekRow).effective_to ?? null,
    }))
  }, [data?.items])

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('Standard week')
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO())
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [formError, setFormError] = useState<string | null>(null)

  const createMut = useMutation({
    mutationFn: () =>
      createWorkingWeek({
        name: name.trim(),
        working_days_of_week: days,
        effective_from: effectiveFrom,
      }),
    onSuccess: async () => {
      setShowCreate(false)
      setFormError(null)
      setName('Standard week')
      setEffectiveFrom(todayISO())
      setDays([0, 1, 2, 3, 4])
      await qc.invalidateQueries({ queryKey: queryKeys.organization.workingWeeks() })
    },
    onError: (e: unknown) => {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String(
              (e as { response?: { data?: { detail?: unknown; message?: string } } }).response?.data
                ?.detail ??
                (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
                (e as Error).message,
            )
          : e instanceof Error
            ? e.message
            : 'Failed to create working week'
      setFormError(msg)
    },
  })

  const archiveMut = useMutation({
    mutationFn: (id: number) => archiveWorkingWeek(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.workingWeeks() })
    },
  })

  const toggleDay = (i: number) => {
    setDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort((a, b) => a - b),
    )
  }

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/admin/settings" label="Back to settings" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Working weeks</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Versioned weekly schedules. Creating a new week closes the previous open version.
            Days use 0=Mon … 6=Sun (backend convention).
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowCreate(true)
            setFormError(null)
          }}
        >
          Create working week
        </Button>
      </div>

      {showCreate && (
        <div className="bv-surface p-6 space-y-4 border border-secondary/30">
          <h3 className="text-title-md font-semibold text-on-background">New working week</h3>
          {formError && (
            <p className="text-body-sm text-error rounded-lg border border-error/30 bg-error/10 px-3 py-2">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-secondary"
                placeholder="e.g. Standard week"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">
                Effective from
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-secondary"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Working days</p>
            <div className="flex flex-wrap gap-2">
              {DAY.map((label, i) => {
                const on = days.includes(i)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-label-sm font-medium border transition-colors cursor-pointer',
                      on
                        ? 'bg-secondary/15 text-secondary border-secondary/20'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createMut.isPending}
              disabled={!name.trim() || days.length === 0 || !effectiveFrom}
              onClick={() => createMut.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !showCreate && (
        <div className="bv-surface p-12 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
          No working weeks configured yet. Use <strong>Create working week</strong> to add the first
          version.
        </div>
      )}

      <div className="space-y-4">
        {items.map((w) => {
          const open = w.effective_to == null
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
                    {open ? ' · current' : ' · closed'}
                  </span>
                </div>
                {open && (
                  <ArchiveButton
                    entityLabel={w.name}
                    mode="archive"
                    label="Close version"
                    size="sm"
                    isLoading={archiveMut.isPending}
                    onConfirm={() => archiveMut.mutateAsync(w.id)}
                  />
                )}
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
          )
        })}
      </div>
    </div>
  )
}
