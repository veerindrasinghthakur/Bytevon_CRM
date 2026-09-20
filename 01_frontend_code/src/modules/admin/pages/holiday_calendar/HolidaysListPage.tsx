import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useHolidays } from '../../hooks/settings/use-settings'
import { createHoliday, getHolidayCalendar, getHolidays, deleteHoliday } from '../../api/organization'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import type { HolidayRow } from '@/shared/schema'
import { queryKeys } from '@/shared/lib/query-keys'
import { holidayTypes as TYPES } from '../../schemas/enums'

export function HolidaysListPage() {
  const { calendarId } = useParams({ strict: false }) as { calendarId: string }
  const id = Number(calendarId)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useHolidays(id)
  const calQuery = useQuery({
    queryKey: queryKeys.organization.holidays.detail(id),
    queryFn: () => getHolidayCalendar(id),
    enabled: Number.isFinite(id),
  })
  const items = data?.items ?? []

  const [adding, setAdding] = useState(false)
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [form, setForm] = useState({
    name: '',
    date: '',
    holiday_type: 'NATIONAL' as HolidayRow['holiday_type'],
    recurring_flag: true,
  })
  const [pickHolidayId, setPickHolidayId] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const allHolidaysQuery = useQuery({
    queryKey: queryKeys.organization.holidays.all(),
    queryFn: () => getHolidays(),
    enabled: adding && mode === 'existing',
  })

  const existingOptions =
    allHolidaysQuery.data?.items
      ?.filter((h) => h.holiday_calendar_id !== id)
      .map((h) => ({
        value: String(h.id),
        label: `${h.name} (${h.date})`,
      })) ?? []

  const createMut = useMutation({
    mutationFn: async () => {
      setSaveError(null)
      if (mode === 'existing' && pickHolidayId) {
        const src = allHolidaysQuery.data?.items.find((h) => String(h.id) === pickHolidayId)
        if (!src) throw new Error('Holiday not found')
        return createHoliday({
          holiday_calendar_id: id,
          name: src.name,
          date: src.date,
          holiday_type: src.holiday_type,
          recurring_flag: src.recurring_flag,
        })
      }
      if (!form.name.trim() || !form.date) throw new Error('Name and date are required')
      return createHoliday({
        holiday_calendar_id: id,
        name: form.name,
        date: form.date,
        holiday_type: form.holiday_type,
        recurring_flag: form.recurring_flag,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.holidays.all() })
      await qc.invalidateQueries({ queryKey: queryKeys.organization.holidays.detail(id) })
      setAdding(false)
      setForm({ name: '', date: '', holiday_type: 'NATIONAL', recurring_flag: true })
      setPickHolidayId('')
      setSaveError(null)
    },
    onError: (e: unknown) => setSaveError(getApiErrorMessage(e, 'Failed to save holiday')),
  })

  const deleteMut = useMutation({
    mutationFn: (holidayId: number) => deleteHoliday(holidayId),
    onSuccess: async () => {
      setDeleteError(null)
      await qc.invalidateQueries({ queryKey: queryKeys.organization.holidays.all() })
      await qc.invalidateQueries({ queryKey: queryKeys.organization.holidays.detail(id) })
    },
    onError: (e: unknown) => setDeleteError(getApiErrorMessage(e, 'Failed to delete holiday')),
  })

  if (isLoading || calQuery.isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(error, 'Could not load holidays')}
        onRetry={() => void refetch()}
        onBack={() => safeNavigate(navigate, { to: '/admin/settings/holidays' })}
      />
    )
  }

  const calName = calQuery.data?.name ?? `Calendar #${id}`

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/admin/settings/holidays" label="Back to holiday calendars" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">{calName}</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">Holiday schedule · Calendar #{id}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
          onClick={() => {
            setAdding(true)
            setSaveError(null)
          }}
        >
          Add Holiday
        </Button>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error">
          {deleteError}
        </div>
      )}

      {adding && (
        <div className="bv-surface p-5 space-y-4 max-w-xl">
          <h3 className="text-title-md font-semibold">Add holiday</h3>
          <div className="flex gap-2">
            <Button variant={mode === 'new' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('new')}>
              Create new
            </Button>
            <Button
              variant={mode === 'existing' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMode('existing')}
            >
              Add existing
            </Button>
          </div>

          {mode === 'existing' ? (
            <Select
              value={pickHolidayId}
              onChange={setPickHolidayId}
              options={[{ value: '', label: 'Select holiday…' }, ...existingOptions]}
              placeholder="Search existing"
              minWidthClass="w-full"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Republic Day"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase">Type</label>
                <select
                  value={form.holiday_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      holiday_type: e.target.value as HolidayRow['holiday_type'],
                    }))
                  }
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm mt-1"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-body-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.recurring_flag}
                  onChange={(e) => setForm((p) => ({ ...p, recurring_flag: e.target.checked }))}
                />
                Recurring annually
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAdding(false)
                setSaveError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Save holiday
            </Button>
          </div>
          {(saveError || createMut.isError) && (
            <p className="text-body-sm text-error">
              {saveError || getApiErrorMessage(createMut.error, 'Failed to save holiday')}
            </p>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title="No holidays" description="Add holidays to this calendar." />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Name', 'Date', 'Type', 'Recurring', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b border-outline-variant last:border-0 bv-row-hover">
                  <td className="px-5 py-3 font-medium">{h.name}</td>
                  <td className="px-5 py-3 text-body-sm">{h.date}</td>
                  <td className="px-5 py-3 text-body-sm">{h.holiday_type}</td>
                  <td className="px-5 py-3 text-body-sm">{h.recurring_flag ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3 text-right">
                    <DeleteButton
                      iconOnly
                      entityLabel={`${h.name} (${h.date})`}
                      isLoading={deleteMut.isPending}
                      onConfirm={() => deleteMut.mutateAsync(h.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
