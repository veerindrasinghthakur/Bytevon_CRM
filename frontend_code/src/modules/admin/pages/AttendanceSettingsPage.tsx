import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

function Toggle({ on = false, disabled = false }: { on?: boolean; disabled?: boolean }) {
  return (
    <div className={cn('relative inline-block w-10 h-6 shrink-0', disabled && 'opacity-70')}>
      <div className={cn('w-full h-full rounded-full transition-all', on ? 'bg-secondary' : 'bg-outline-variant')} />
      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all', on ? 'left-5' : 'left-1')} />
    </div>
  )
}

export function AttendanceSettingsPage() {
  const [editing, setEditing] = useState(false)
  const [shiftStart, setShiftStart] = useState('09:00')
  const [shiftEnd, setShiftEnd] = useState('18:00')
  const [grace, setGrace] = useState(15)
  const [earlyOut, setEarlyOut] = useState(30)
  const [otMin, setOtMin] = useState(60)

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        {editing ? (
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={() => setEditing(false)}>
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
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Working Hours &amp; Days</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Standard Shift Start</label>
              {editing ? (
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary bg-white"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{shiftStart}</p>
              )}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Standard Shift End</label>
              {editing ? (
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary bg-white"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{shiftEnd}</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
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
                  value={grace}
                  onChange={(e) => setGrace(Number(e.target.value))}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary bg-white"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{grace} min</p>
              )}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Early-out Threshold (Min)</label>
              {editing ? (
                <input
                  type="number"
                  value={earlyOut}
                  onChange={(e) => setEarlyOut(Number(e.target.value))}
                  className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary bg-white"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{earlyOut} min</p>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-label-md text-on-surface">Allow Remote Check-in</span>
              <Toggle on disabled={!editing} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">calculate</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Overtime</h3>
          </div>
          <div>
            <label className="block text-label-md text-on-surface-variant mb-2">Min OT Duration (Min)</label>
            {editing ? (
              <input
                type="number"
                value={otMin}
                onChange={(e) => setOtMin(Number(e.target.value))}
                className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary bg-white"
              />
            ) : (
              <p className="text-body-md font-medium text-on-surface">{otMin} min</p>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
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
