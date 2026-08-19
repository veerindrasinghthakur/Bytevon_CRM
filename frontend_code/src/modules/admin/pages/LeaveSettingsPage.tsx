import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { useLeaveEdit } from '../context/LeaveEditContext'

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

/** Content only — Edit lives above sub-nav in LeaveSettingsLayout */
export function LeaveSettingsPage() {
  const { editing } = useLeaveEdit()
  const [modalOpen, setModalOpen] = useState(false)
  const [newType, setNewType] = useState({ name: '', days: '10', eligibility: 'All Employees' })
  const [carryOver, setCarryOver] = useState(10)
  const [noticeDays, setNoticeDays] = useState(7)

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 bv-surface card-hover p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">ballot</span>
              <h3 className="text-title-lg font-semibold text-on-surface">Leave Types & Entitlements</h3>
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
                  <th className="pb-3 text-label-md text-on-surface-variant">Eligibility</th>
                  <th className="pb-3 text-label-md text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {LEAVE_TYPES.map((row) => (
                  <tr key={row.name} className="zebra-row">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bv-surface card-hover p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">update</span>
            <h3 className="text-title-lg font-semibold text-on-surface">Accrual Policy</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Max Carry-over (Days)</label>
              {editing ? (
                <input
                  type="number"
                  value={carryOver}
                  onChange={(e) => setCarryOver(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-body-md transition-colors"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{carryOver} days</p>
              )}
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Minimum notice</label>
              {editing ? (
                <input
                  type="number"
                  value={noticeDays}
                  onChange={(e) => setNoticeDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-body-md transition-colors"
                />
              ) : (
                <p className="text-body-md font-medium text-on-surface">{noticeDays} days</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bv-surface executive-shadow w-full max-w-md">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <h3 className="text-title-lg font-semibold">Add Leave Type</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="hover:bg-surface-container rounded-lg p-1 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                <input
                  value={newType.name}
                  onChange={(e) => setNewType((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Leave type name"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
                />
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
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
