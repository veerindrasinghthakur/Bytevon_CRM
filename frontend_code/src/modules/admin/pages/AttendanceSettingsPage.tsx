import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { Select } from '@/shared/components/ui/Select'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { cn } from '@/shared/lib/cn'
import { getAttendanceSettings, updateAttendanceSettings } from '../api/settings'
import { getAttendanceAdminMetrics } from '../api/metrics'
import { getShifts } from '../api/organization'
import type { AttendanceSettings } from '../types'
import type { ShiftRow } from '@/shared/schema'

function Toggle({ on = false, disabled = false }: { on?: boolean; disabled?: boolean }) {
  return (
    <div className={cn('relative inline-block w-10 h-6 shrink-0', disabled && 'opacity-70')}>
      <div className={cn('w-full h-full rounded-full transition-all', on ? 'bg-secondary' : 'bg-outline-variant')} />
      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all', on ? 'left-5' : 'left-1')} />
    </div>
  )
}

function shiftToForm(s: ShiftRow): AttendanceSettings {
  return {
    shiftStart: String(s.start_time).slice(0, 5),
    shiftEnd: String(s.end_time).slice(0, 5),
    graceMinutes: s.grace_late_minutes ?? 15,
    earlyOutMinutes: 30,
    otMinMinutes: 60,
    allowRemoteCheckIn: true,
  }
}

function aggregateShifts(shifts: ShiftRow[]): AttendanceSettings {
  if (!shifts.length) {
    return {
      shiftStart: '09:00',
      shiftEnd: '18:00',
      graceMinutes: 15,
      earlyOutMinutes: 30,
      otMinMinutes: 60,
      allowRemoteCheckIn: true,
    }
  }
  // Show first shift times as representative when "all shifts"
  const s = shifts[0]
  return {
    ...shiftToForm(s),
    graceMinutes: Math.max(...shifts.map((x) => x.grace_late_minutes ?? 15)),
  }
}

export function AttendanceSettingsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings', 'attendance'],
    queryFn: getAttendanceSettings,
  })

  const { data: metrics } = useQuery({
    queryKey: ['admin', 'metrics', 'attendance'],
    queryFn: getAttendanceAdminMetrics,
  })

  const shiftsQuery = useQuery({
    queryKey: ['organization', 'shifts', { includeArchived: false }],
    queryFn: () => getShifts({ includeArchived: false }),
  })

  const shifts = shiftsQuery.data?.items ?? []
  const [selectedShiftId, setSelectedShiftId] = useState<string>('')

  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const [form, setForm] = useState<AttendanceSettings | null>(null)

  const activeShift = useMemo(
    () => (selectedShiftId ? shifts.find((s) => String(s.id) === selectedShiftId) : null),
    [selectedShiftId, shifts],
  )

  useEffect(() => {
    if (isEditing) return
    if (selectedShiftId && activeShift) {
      setForm(shiftToForm(activeShift))
      return
    }
    // No shift picked → aggregate / company defaults
    if (shifts.length) {
      setForm(aggregateShifts(shifts))
    } else if (data) {
      setForm({ ...data })
    }
  }, [isEditing, selectedShiftId, activeShift, shifts, data])

  const save = useMutation({
    mutationFn: () => updateAttendanceSettings(form!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings', 'attendance'] })
      finishEditing()
    },
  })

  if (isLoading || shiftsQuery.isLoading || !form) {
    return (
      <div className="py-12 text-center text-on-surface-variant text-body-sm">Loading attendance settings…</div>
    )
  }

  const shiftOptions = [
    { value: '', label: 'All shifts (company default)' },
    ...shifts.map((s) => ({
      value: String(s.id),
      label: `${s.name} (${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)})`,
    })),
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="how_to_reg"
          label="Present Today"
          value={String(metrics?.presentToday ?? '—')}
          hint="Checked in"
        />
        <MetricCard
          icon="schedule"
          label="Late Today"
          value={String(metrics?.lateToday ?? '—')}
          hint="After grace"
          valueClassName="text-error"
        />
        <MetricCard
          icon="event_busy"
          label="On Leave"
          value={String(metrics?.onLeaveToday ?? '—')}
          hint="Today"
        />
        <MetricCard
          icon="home_work"
          label="Remote Check-ins"
          value={String(metrics?.remoteCheckIns ?? '—')}
          hint="Today"
        />
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px]">
            <Select
              value={selectedShiftId}
              onChange={setSelectedShiftId}
              options={shiftOptions}
              placeholder="Select shift"
              minWidthClass="min-w-[240px]"
            />
          </div>
          <p className="text-body-sm text-on-surface-variant">
            {selectedShiftId
              ? `Settings scoped to ${activeShift?.name ?? 'shift'}`
              : 'Showing combined / default settings across all shifts'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/admin/settings/shifts/new' })}
          >
            Create Shift
          </Button>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedShiftId && activeShift) setForm(shiftToForm(activeShift))
                  else if (shifts.length) setForm(aggregateShifts(shifts))
                  else if (data) setForm({ ...data })
                  cancelEditing()
                }}
                disabled={save.isPending}
              >
                Discard
              </Button>
              <Button variant="primary" size="sm" isLoading={save.isPending} onClick={() => save.mutate()}>
                Save Changes
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
              onClick={startEditing}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {!shifts.length && (
        <EmptyState
          title="No shifts configured"
          description="Create a shift to apply attendance rules per schedule. Until then, company defaults are shown."
          actionLabel="Create Shift"
          onAction={() => navigate({ to: '/admin/settings/shifts/new' })}
        />
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Working Hours & Days</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Standard Shift Start</label>
              {isEditing ? (
                <input
                  type="time"
                  value={form.shiftStart}
                  onChange={(e) => setForm((p) => p && { ...p, shiftStart: e.target.value })}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{form.shiftStart}</p>
              )}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Standard Shift End</label>
              {isEditing ? (
                <input
                  type="time"
                  value={form.shiftEnd}
                  onChange={(e) => setForm((p) => p && { ...p, shiftEnd: e.target.value })}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{form.shiftEnd}</p>
              )}
            </div>
          </div>
          {!selectedShiftId && shifts.length > 1 && (
            <div className="mt-6 border-t border-outline-variant pt-4">
              <p className="text-label-sm text-on-surface-variant uppercase mb-2">All shifts</p>
              <ul className="space-y-1 text-body-sm">
                {shifts.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <span className="font-medium text-on-surface">{s.name}</span>
                    <span className="text-on-surface-variant">
                      {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)} · grace{' '}
                      {s.grace_late_minutes}m
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">gavel</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Check-in Rules</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Late Grace Period (Min)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={form.graceMinutes}
                  onChange={(e) => setForm((p) => p && { ...p, graceMinutes: Number(e.target.value) })}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{form.graceMinutes} min</p>
              )}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Early-out Threshold (Min)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={form.earlyOutMinutes}
                  onChange={(e) => setForm((p) => p && { ...p, earlyOutMinutes: Number(e.target.value) })}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{form.earlyOutMinutes} min</p>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-label-md text-on-surface">Allow Remote Check-in</span>
              <button
                type="button"
                disabled={!isEditing}
                onClick={() =>
                  isEditing && setForm((p) => p && { ...p, allowRemoteCheckIn: !p.allowRemoteCheckIn })
                }
                className="disabled:cursor-default cursor-pointer"
                aria-label="Toggle remote check-in"
              >
                <Toggle on={form.allowRemoteCheckIn} disabled={!isEditing} />
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">calculate</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Overtime</h3>
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Min OT Duration (Min)</label>
            {isEditing ? (
              <input
                type="number"
                value={form.otMinMinutes}
                onChange={(e) => setForm((p) => p && { ...p, otMinMinutes: Number(e.target.value) })}
                className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
              />
            ) : (
              <p className="text-body-md font-medium text-on-surface">{form.otMinMinutes} min</p>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Approval Workflow</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-secondary">
              <span className="text-label-md text-on-surface">Level 1: Direct Supervisor</span>
              <p className="text-body-sm text-on-surface-variant mt-1">Required for exceptions and manual logs.</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-outline">
              <span className="text-label-md text-on-surface">Level 2: Department Head</span>
              <p className="text-body-sm text-on-surface-variant mt-1">Optional for overtime over 4 hours.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
