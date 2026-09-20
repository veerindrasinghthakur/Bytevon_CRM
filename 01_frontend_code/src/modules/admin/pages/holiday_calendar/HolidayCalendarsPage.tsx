import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useHolidayCalendars } from '../../hooks/settings/use-settings'
import { createHolidayCalendar, deleteHolidayCalendar } from '../../api/organization'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import { cn } from '@/shared/lib/cn'
import { queryKeys } from '@/shared/lib/query-keys'

export function HolidayCalendarsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useHolidayCalendars()
  const items = data?.items ?? []
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const createMut = useMutation({
    mutationFn: () => createHolidayCalendar({ name }),
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.holidays.all() })
      setCreating(false)
      setName('')
      safeNavigate(navigate, {
        to: '/admin/settings/holidays/$calendarId',
        params: { calendarId: String(row.id) },
      })
    },
    onError: () => {
      // Errors surface via createMut.error in the UI
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteHolidayCalendar(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.holidays.all() })
    },
  })

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/admin/settings" label="Back to settings" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Calendars</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Holiday calendars linked to office locations — open a calendar to manage holidays
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
          onClick={() => setCreating(true)}
        >
          Create Calendar
        </Button>
      </div>

      {creating && (
        <div className="bv-surface p-5 space-y-3 max-w-lg">
          <h3 className="text-title-md font-semibold">New holiday calendar</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. India National 2027"
            className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!name.trim() || createMut.isPending}
              isLoading={createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Create
            </Button>
          </div>
          {createMut.isError && (
            <p className="text-body-sm text-error">{(createMut.error as Error).message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((c) => (
          <Link
            key={c.id}
            to={"/admin/settings/holidays/$calendarId" as never}
            params={{ calendarId: String(c.id) } as never}
            className="block bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[28px]">calendar_month</span>
                <h3 className="text-title-md font-semibold text-on-background">{c.name}</h3>
              </div>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                  c.is_archived
                    ? 'bg-surface-container text-on-surface-variant'
                    : 'bg-secondary/15 text-secondary',
                )}
              >
                {c.is_archived ? 'ARCHIVED' : 'ACTIVE'}
              </span>
            </div>
            <p className="mt-3 text-body-sm text-on-surface-variant">View holidays inside this calendar →</p>
            {!c.is_archived && (
              <div className="mt-3 flex justify-end" onClick={(e) => e.preventDefault()}>
                <DeleteButton
                  iconOnly
                  entityLabel={c.name}
                  isLoading={deleteMut.isPending}
                  onConfirm={() => deleteMut.mutateAsync(c.id)}
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
