import { useState } from 'react'
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

/** Content-only leave types / rules (header lives in LeaveSettingsLayout). */
export function LeaveSettingsPage() {
  const [editing, setEditing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newType, setNewType] = useState({ name: '', days: '10', eligibility: 'All Employees' })
  const [carryOver, setCarryOver] = useState(10)
  const [noticeDays, setNoticeDays] = useState(7)

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
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Cycle Reset Date</label>
              <p className="text-body-md font-medium text-on-surface">January 1st (Calendar Year)</p>
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
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">account_tree</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Approval Workflow</h3>
          </div>
          <div className="relative pl-6 border-l-2 border-secondary/30 space-y-6">
            <div>
              <div className="text-label-md text-secondary">Step 1: Direct Manager</div>
              <p className="text-label-sm text-on-surface-variant">Automatic routing to immediate supervisor.</p>
            </div>
            <div>
              <div className="text-label-md text-secondary">Step 2: Department Head</div>
              <p className="text-label-sm text-on-surface-variant">Required for leaves exceeding 5 days.</p>
            </div>
          </div>
        </section>
      </div>

      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <h3 className="text-title-lg font-semibold text-on-background">Add Leave Type</h3>
                <button type="button" className="p-1 rounded-lg hover:bg-surface-container" onClick={() => setModalOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <input
                  value={newType.name}
                  onChange={(e) => setNewType((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Leave type name"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary bg-white"
                />
              </div>
              <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                  Create
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
