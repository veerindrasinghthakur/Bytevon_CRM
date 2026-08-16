import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

const LEAVE_TYPES = [
  {
    name: 'Annual Leave',
    desc: 'Standard paid vacation',
    days: '21 Days',
    eligibility: 'All Employees',
    eligibilityStyle: 'bg-secondary/10 text-secondary',
  },
  {
    name: 'Sick Leave',
    desc: 'Medical and health related',
    days: '10 Days',
    eligibility: 'All Employees',
    eligibilityStyle: 'bg-secondary/10 text-secondary',
  },
  {
    name: 'Maternity Leave',
    desc: 'Parental support leave',
    days: '90 Days',
    eligibility: 'Female only',
    eligibilityStyle: 'bg-surface-container text-on-surface-variant',
  },
  {
    name: 'Casual Leave',
    desc: 'Unplanned personal matters',
    days: '5 Days',
    eligibility: 'Full-time',
    eligibilityStyle: 'bg-secondary/10 text-secondary',
  },
]

export function LeaveSettingsPage() {
  const [editing, setEditing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newType, setNewType] = useState({ name: '', days: '10', eligibility: 'All Employees' })
  const [carryOver, setCarryOver] = useState(10)
  const [noticeDays, setNoticeDays] = useState(7)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leave Settings"
        description="Manage leave types, entitlements, and global accrual policies for all organizational entities."
        actions={
          editing ? (
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
          )
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">ballot</span>
              <h3 className="text-title-lg font-semibold text-on-surface">Leave Types &amp; Entitlements</h3>
            </div>
            {editing && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 text-secondary text-label-md hover:underline"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Add New Type
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-outline-variant">
                  <th className="pb-3 text-label-md text-on-surface-variant">Leave Type</th>
                  <th className="pb-3 text-label-md text-on-surface-variant">Base Days/Year</th>
                  <th className="pb-3 text-label-md text-on-surface-variant">Gender/Eligibility</th>
                  <th className="pb-3 text-label-md text-on-surface-variant">Status</th>
                  {editing && <th className="pb-3 text-label-md text-on-surface-variant" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {LEAVE_TYPES.map((row) => (
                  <tr key={row.name} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4">
                      <div className="text-body-md font-semibold text-on-surface">{row.name}</div>
                      <div className="text-label-sm text-on-surface-variant">{row.desc}</div>
                    </td>
                    <td className="py-4 text-body-md text-on-surface">{row.days}</td>
                    <td className="py-4">
                      <span className={cn('px-2 py-1 rounded text-label-sm', row.eligibilityStyle)}>
                        {row.eligibility}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="flex items-center gap-1 text-label-sm text-secondary font-bold">
                        <span className="w-2 h-2 rounded-full bg-secondary" /> Active
                      </span>
                    </td>
                    {editing && (
                      <td className="py-4 text-right">
                        <button type="button" className="material-symbols-outlined text-outline hover:text-secondary">
                          more_vert
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">update</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Accrual Policy</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Max Carry-over Limits (Days)</label>
              {editing ? (
                <input
                  type="number"
                  value={carryOver}
                  onChange={(e) => setCarryOver(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none text-body-md"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{carryOver} days</p>
              )}
              <p className="mt-1.5 text-label-sm text-on-surface-variant italic">
                Days automatically transferred to next cycle.
              </p>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Cycle Reset Date</label>
              {editing ? (
                <select className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary outline-none text-body-md">
                  <option>January 1st (Calendar Year)</option>
                  <option>April 1st (Fiscal Year)</option>
                  <option>Employee Anniversary</option>
                </select>
              ) : (
                <p className="text-body-md font-medium text-on-surface">January 1st (Calendar Year)</p>
              )}
            </div>
            <div className="pt-4 border-t border-outline-variant space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-label-md text-on-surface">Enable Prorated Accrual</span>
                <Toggle on disabled={!editing} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-label-md text-on-surface">Accrual Frequency</span>
                <span className="text-body-sm text-secondary font-bold">Monthly</span>
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">block</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Application Restrictions</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface rounded-lg border border-outline-variant">
              <label className="block text-label-md text-on-surface-variant mb-2">Minimum Notice Period</label>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={noticeDays}
                    onChange={(e) => setNoticeDays(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded border border-outline-variant focus:border-secondary outline-none bg-white"
                  />
                  <span className="text-body-sm text-on-surface-variant">Days before start date</span>
                </div>
              ) : (
                <p className="text-body-md font-medium text-on-surface">{noticeDays} days before start date</p>
              )}
            </div>
            <div className="p-4 bg-surface rounded-lg border border-outline-variant">
              <div className="flex justify-between items-center mb-2">
                <label className="text-label-md text-on-surface-variant">Blackout Dates</label>
                {editing && (
                  <button type="button" className="text-secondary text-label-sm font-bold">
                    Manage
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-error-container text-on-error-container text-[11px] rounded flex items-center gap-1">
                  Dec 15 - Jan 05
                  {editing && <span className="material-symbols-outlined text-[14px]">close</span>}
                </span>
                <span className="px-2 py-1 bg-error-container text-on-error-container text-[11px] rounded flex items-center gap-1">
                  Quarter End
                  {editing && <span className="material-symbols-outlined text-[14px]">close</span>}
                </span>
              </div>
            </div>
            <label className="flex items-start gap-3 mt-2">
              <input
                type="checkbox"
                defaultChecked
                disabled={!editing}
                className="mt-1 rounded text-secondary border-outline-variant disabled:opacity-60"
              />
              <span className="text-body-sm text-on-surface-variant">
                Prevent applications if balance is insufficient (No negative balance).
              </span>
            </label>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Approval Workflow</h3>
          </div>
          <div className="space-y-4">
            <div className="relative pl-6 border-l-2 border-secondary/30">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-secondary border-2 border-white" />
              <div className="mb-6">
                <div className="text-label-md text-secondary">Step 1: Direct Manager</div>
                <p className="text-label-sm text-on-surface-variant">Automatic routing to immediate supervisor.</p>
              </div>
              <div className="absolute -left-[9px] top-[75px] w-4 h-4 rounded-full bg-secondary border-2 border-white" />
              <div className="mb-2">
                <div className="text-label-md text-secondary">Step 2: Department Head</div>
                <p className="text-label-sm text-on-surface-variant">Required for leaves exceeding 5 days.</p>
              </div>
            </div>
            {editing && (
              <button
                type="button"
                className="w-full py-2 bg-surface-container text-secondary text-label-md rounded border border-secondary border-dashed hover:bg-surface-container-high"
              >
                + Add Approval Level
              </button>
            )}
            <div className="pt-4 mt-2">
              <label className="block text-label-md text-on-surface-variant mb-2">Notification Triggers</label>
              <div className="grid grid-cols-2 gap-2">
                {['Slack / Teams', 'Email', 'In-App Push', 'SMS'].map((ch, i) => (
                  <label key={ch} className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                    <input
                      type="checkbox"
                      defaultChecked={i < 2}
                      disabled={!editing}
                      className="rounded text-secondary disabled:opacity-60"
                    />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">calendar_month</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Holiday Interaction</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface border border-outline-variant">
              <span className="material-symbols-outlined text-outline">weekend</span>
              <div>
                <div className="text-label-md text-on-surface">Include Weekends</div>
                <p className="text-label-sm text-on-surface-variant mb-3">
                  Count Saturday/Sunday as leave days if part of a range.
                </p>
                {editing ? (
                  <div className="inline-flex rounded-md shadow-sm">
                    <button type="button" className="px-4 py-1.5 bg-surface-container border border-outline-variant text-label-sm rounded-l-md font-bold">
                      No
                    </button>
                    <button type="button" className="px-4 py-1.5 bg-secondary text-on-secondary border border-secondary text-label-sm rounded-r-md font-bold">
                      Yes
                    </button>
                  </div>
                ) : (
                  <span className="text-body-sm font-semibold text-secondary">Yes</span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface border border-outline-variant">
              <span className="material-symbols-outlined text-outline">event_available</span>
              <div>
                <div className="text-label-md text-on-surface">Statutory Holidays</div>
                <p className="text-label-sm text-on-surface-variant mb-3">
                  Automatically exclude public holidays from leave deductions.
                </p>
                {editing ? (
                  <div className="inline-flex rounded-md shadow-sm">
                    <button type="button" className="px-4 py-1.5 bg-secondary text-on-secondary border border-secondary text-label-sm rounded-l-md font-bold">
                      No
                    </button>
                    <button type="button" className="px-4 py-1.5 bg-surface-container border border-outline-variant text-label-sm rounded-r-md font-bold">
                      Yes
                    </button>
                  </div>
                ) : (
                  <span className="text-body-sm font-semibold text-on-surface">No</span>
                )}
              </div>
            </div>
            <div className="p-4 bg-surface-container-high rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2 mb-2 text-label-md text-on-surface">
                <span className="material-symbols-outlined text-secondary text-sm">info</span>
                Configuration Audit
              </div>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                Changes to these settings will not retroactively affect existing approved leave requests but will apply
                to all pending and future applications.
              </p>
            </div>
          </div>
        </section>
      </div>

      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md ring-4 ring-secondary/10">
              <div className="px-6 py-4 border-b border-outline-variant bg-secondary/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">event_busy</span>
                  <h3 className="text-title-lg font-semibold text-on-background">Add Leave Type</h3>
                </div>
                <button type="button" className="p-1 rounded-lg hover:bg-surface-container" onClick={() => setModalOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Leave Type Name</label>
                  <input
                    value={newType.name}
                    onChange={(e) => setNewType((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Compensatory Off"
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Base Days/Year</label>
                    <input
                      value={newType.days}
                      onChange={(e) => setNewType((p) => ({ ...p, days: e.target.value }))}
                      className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Eligibility</label>
                    <select
                      value={newType.eligibility}
                      onChange={(e) => setNewType((p) => ({ ...p, eligibility: e.target.value }))}
                      className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary bg-white"
                    >
                      <option>All Employees</option>
                      <option>Full-time</option>
                      <option>Female only</option>
                      <option>Male only</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2 bg-surface-container-low/40">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                  Create Leave Type
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Toggle({ on = false, disabled = false }: { on?: boolean; disabled?: boolean }) {
  return (
    <div className={cn('relative inline-block w-10 h-6 shrink-0', disabled && 'opacity-70')}>
      <div className={cn('w-full h-full rounded-full transition-all', on ? 'bg-secondary' : 'bg-outline-variant')} />
      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all', on ? 'left-5' : 'left-1')} />
    </div>
  )
}
