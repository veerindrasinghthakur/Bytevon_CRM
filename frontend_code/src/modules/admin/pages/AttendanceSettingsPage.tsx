import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

function Toggle({ on = false }: { on?: boolean }) {
  return (
    <div className={cn('relative inline-block w-10 h-6 shrink-0', on ? '' : '')}>
      <div className={cn('w-full h-full rounded-full transition-all', on ? 'bg-secondary' : 'bg-outline-variant')} />
      <div
        className={cn(
          'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
          on ? 'left-5' : 'left-1'
        )}
      />
    </div>
  )
}

export function AttendanceSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Settings"
        description="Configure organization-wide attendance policies, working hours, and rules to maintain operational discipline and employee performance tracking."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Working Hours & Days */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            <h3 className="text-title-lg font-semibold text-primary">Working Hours &amp; Days</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-on-surface mb-2">Standard Shift Start</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  login
                </span>
                <input
                  type="time"
                  defaultValue="09:00"
                  className="w-full border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-on-surface mb-2">Standard Shift End</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  logout
                </span>
                <input
                  type="time"
                  defaultValue="18:00"
                  className="w-full border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <label className="block text-label-md text-on-surface mb-4">Weekend Configuration</label>
            <div className="flex flex-wrap gap-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                (day) => {
                  const isWeekend = day === 'Saturday' || day === 'Sunday'
                  return (
                    <label key={day} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        defaultChecked={isWeekend}
                        className="w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary"
                      />
                      <span
                        className={cn(
                          'text-body-md text-on-surface group-hover:text-secondary transition-colors',
                          isWeekend && 'font-bold'
                        )}
                      >
                        {day}
                      </span>
                    </label>
                  )
                }
              )}
            </div>
          </div>
        </div>

        {/* Check-in Rules */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">gavel</span>
            <h3 className="text-title-lg font-semibold text-primary">Check-in Rules</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-label-md text-on-surface mb-2">Late Grace Period (Min)</label>
              <input
                type="number"
                defaultValue={15}
                className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">Tolerance before marking as &quot;Late&quot;</p>
            </div>
            <div>
              <label className="block text-label-md text-on-surface mb-2">Early-out Threshold (Min)</label>
              <input
                type="number"
                defaultValue={30}
                className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">Min. time before marked as &quot;Half-day&quot;</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-label-md text-on-surface">Allow Remote Check-in</span>
              <Toggle on />
            </div>
          </div>
        </div>

        {/* Overtime & Calculation */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">calculate</span>
            <h3 className="text-title-lg font-semibold text-primary">Overtime &amp; Calculation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-label-md text-on-surface mb-2">OT Multiplier (x)</label>
              <select className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary bg-white">
                <option>1.0 (Standard)</option>
                <option selected>1.5 (Regular OT)</option>
                <option>2.0 (Double Time)</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface mb-2">Min OT Duration (Min)</label>
              <input
                type="number"
                defaultValue={60}
                className="w-full border border-outline-variant rounded-lg px-4 py-3 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between p-4 border border-outline-variant/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">weekend</span>
                  <div>
                    <p className="text-label-md text-on-surface">Auto-calculate Weekend Premium</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Automatically apply 2x multiplier for Saturday/Sunday work
                    </p>
                  </div>
                </div>
                <Toggle on />
              </div>
            </div>
          </div>
        </div>

        {/* Approval Workflow */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
            <h3 className="text-title-lg font-semibold text-primary">Approval Workflow</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-secondary">
              <div className="flex justify-between mb-2">
                <span className="text-label-md text-primary">Level 1: Direct Supervisor</span>
                <span className="text-[11px] text-secondary font-bold uppercase">Required</span>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Immediate manager must review attendance exceptions and manual logs.
              </p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-outline">
              <div className="flex justify-between mb-2">
                <span className="text-label-md text-primary">Level 2: Department Head</span>
                <span className="text-[11px] text-outline font-bold uppercase">Optional</span>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Secondary review for overtime exceeding 4 hours per day.
              </p>
            </div>
            <button
              type="button"
              className="w-full py-3 border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center gap-2 text-outline hover:border-secondary hover:text-secondary transition-all"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span className="text-label-md">Add Approval Step</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-secondary">notifications_active</span>
            <h3 className="text-title-lg font-semibold text-primary">Notifications</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: 'warning',
                iconBg: 'bg-secondary-fixed',
                iconColor: 'text-secondary',
                title: 'Late Arrival Alert',
                desc: 'Notify manager after grace period ends.',
                on: true,
              },
              {
                icon: 'event_busy',
                iconBg: 'bg-error-container',
                iconColor: 'text-error',
                title: 'Missing Log Reminder',
                desc: 'Alert user to check-out if log is empty.',
                on: true,
              },
              {
                icon: 'approval_delegation',
                iconBg: 'bg-surface-container-highest',
                iconColor: 'text-primary',
                title: 'OT Approval Required',
                desc: 'Instant ping for pending OT approvals.',
                on: false,
              },
            ].map((n) => (
              <div
                key={n.title}
                className="flex gap-4 p-4 border border-outline-variant rounded-lg hover:border-secondary/30 transition-all"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    n.iconBg
                  )}
                >
                  <span className={cn('material-symbols-outlined', n.iconColor)}>{n.icon}</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface">{n.title}</p>
                  <p className="text-[11px] text-on-surface-variant mb-3">{n.desc}</p>
                  <Toggle on={n.on} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
