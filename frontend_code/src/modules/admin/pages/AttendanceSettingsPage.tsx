import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { getAttendanceSettings, updateAttendanceSettings } from '../api/settings'
import type { AttendanceSettings } from '../types'

function Toggle({ on = false, disabled = false }: { on?: boolean; disabled?: boolean }) {
  return (
    <div className={cn('relative inline-block w-10 h-6 shrink-0', disabled && 'opacity-70')}>
      <div className={cn('w-full h-full rounded-full transition-all', on ? 'bg-secondary' : 'bg-outline-variant')} />
      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all', on ? 'left-5' : 'left-1')} />
    </div>
  )
}

export function AttendanceSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings', 'attendance'],
    queryFn: getAttendanceSettings,
  })

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<AttendanceSettings | null>(null)

  useEffect(() => {
    if (data) setForm({ ...data })
  }, [data])

  const save = useMutation({
    mutationFn: () => updateAttendanceSettings(form!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings', 'attendance'] })
      setEditing(false)
    },
  })

  if (isLoading || !form) {
    return (
      <div className="py-12 text-center text-on-surface-variant text-body-sm">Loading attendance settings…</div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-end">
        {editing ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (data) setForm({ ...data })
                setEditing(false)
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
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Working Hours & Days</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Standard Shift Start</label>
              {editing ? (
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
              {editing ? (
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
        </div>

        <div className="col-span-12 lg:col-span-4 bv-surface card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">gavel</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Check-in Rules</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Late Grace Period (Min)</label>
              {editing ? (
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
              {editing ? (
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
                disabled={!editing}
                onClick={() =>
                  editing && setForm((p) => p && { ...p, allowRemoteCheckIn: !p.allowRemoteCheckIn })
                }
                className="disabled:cursor-default"
                aria-label="Toggle remote check-in"
              >
                <Toggle on={form.allowRemoteCheckIn} disabled={!editing} />
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
            {editing ? (
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
