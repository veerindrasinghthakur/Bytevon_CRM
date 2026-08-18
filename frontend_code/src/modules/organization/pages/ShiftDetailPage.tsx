import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getShifts } from '../api/organization'
import type { ShiftRow } from '@/shared/schema'

export function ShiftDetailPage() {
  const { shiftId } = useParams({ strict: false }) as { shiftId: string }
  const navigate = useNavigate()
  const id = Number(shiftId)
  const [shift, setShift] = useState<ShiftRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<ShiftRow>>({})

  useEffect(() => {
    setLoading(true)
    getShifts({ includeArchived: true })
      .then((r) => {
        const row = r.items.find((s) => s.id === id) ?? null
        setShift(row)
        if (row) setDraft(row)
        if (!row) setError('Shift not found')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoadingSkeleton />
  if (error || !shift) {
    return (
      <ErrorState
        description={error ?? 'Not found'}
        onBack={() => navigate({ to: '/admin/settings/shifts' })}
      />
    )
  }

  const field = (label: string, key: keyof ShiftRow, type: 'text' | 'time' | 'number' = 'text') => (
    <div>
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      {editing ? (
        <input
          type={type}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm"
          value={String(draft[key] ?? '')}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
        />
      ) : (
        <p className="text-body-md font-medium text-on-background">{String(shift[key] ?? '—')}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <BackButton to="/admin/settings/shifts" label="Back to shifts" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">{shift.name}</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {String(shift.start_time).slice(0, 5)} – {String(shift.end_time).slice(0, 5)}
            {shift.is_overnight ? ' · Overnight' : ''}
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false)
                setDraft(shift)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShift({ ...shift, ...draft } as ShiftRow)
                setEditing(false)
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4 card-hover">
          <h3 className="text-title-md font-semibold text-on-background">Schedule</h3>
          {field('Name', 'name')}
          {field('Start time', 'start_time', 'time')}
          {field('End time', 'end_time', 'time')}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Overnight</p>
            <p className="text-body-md font-medium">{shift.is_overnight ? 'Yes' : 'No'}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4 card-hover">
          <h3 className="text-title-md font-semibold text-on-background">Rules</h3>
          {field('Grace late (min)', 'grace_late_minutes', 'number')}
          {field('Break duration (min)', 'break_duration_minutes', 'number')}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Flexible end</p>
            <p className="text-body-md font-medium">{shift.flexible_end ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
