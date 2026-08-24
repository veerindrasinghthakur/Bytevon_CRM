import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { IconButton } from '@/shared/components/ui/IconButton'
import { cn } from '@/shared/lib/cn'
import { useLeaveEdit } from '../context/LeaveEditContext'
import { listLeaveTypeSettings } from '../api/leave'
import { getLeaveAccrualPolicy, updateLeaveAccrualPolicy } from '../api/settings'
import type { LeaveAccrualPolicy } from '../types'

/** Content only — pencil Edit lives on Accrual Policy section */
export function LeaveSettingsPage() {
  const { editing, setEditing } = useLeaveEdit()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [newType, setNewType] = useState({ name: '', days: '10', eligibility: 'All Employees' })
  const [accrual, setAccrual] = useState<LeaveAccrualPolicy | null>(null)

  const { data: leaveTypes = [], isLoading } = useQuery({
    queryKey: ['admin', 'leave', 'types'],
    queryFn: listLeaveTypeSettings,
  })

  const { data: accrualData, isLoading: accrualLoading } = useQuery({
    queryKey: ['admin', 'settings', 'leave-accrual'],
    queryFn: getLeaveAccrualPolicy,
  })

  useEffect(() => {
    if (accrualData) setAccrual({ ...accrualData })
  }, [accrualData])

  const saveAccrual = useMutation({
    mutationFn: () => updateLeaveAccrualPolicy(accrual!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings', 'leave-accrual'] })
    },
  })

  useEffect(() => {
    if (!editing && accrual && accrualData) {
      const dirty =
        accrual.maxCarryOverDays !== accrualData.maxCarryOverDays ||
        accrual.minimumNoticeDays !== accrualData.minimumNoticeDays
      if (dirty) saveAccrual.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when edit flag drops
  }, [editing])

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
            {isLoading ? (
              <div className="py-8 text-center text-on-surface-variant text-body-sm">Loading leave types…</div>
            ) : (
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
                  {leaveTypes.map((row) => (
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
            )}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 bv-surface card-hover p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">update</span>
              <h3 className="text-title-lg font-semibold text-on-surface">Accrual Policy</h3>
            </div>
            {!editing && (
              <IconButton label="Edit accrual policy" size="sm" onClick={() => setEditing(true)}>
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </IconButton>
            )}
          </div>
          {accrualLoading || !accrual ? (
            <p className="text-body-sm text-on-surface-variant">Loading policy…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Max Carry-over (Days)</label>
                {editing ? (
                  <input
                    type="number"
                    value={accrual.maxCarryOverDays}
                    onChange={(e) =>
                      setAccrual((p) => p && { ...p, maxCarryOverDays: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-body-md transition-colors"
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-surface">{accrual.maxCarryOverDays} days</p>
                )}
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Minimum notice</label>
                {editing ? (
                  <input
                    type="number"
                    value={accrual.minimumNoticeDays}
                    onChange={(e) =>
                      setAccrual((p) => p && { ...p, minimumNoticeDays: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-body-md transition-colors"
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-surface">{accrual.minimumNoticeDays} days</p>
                )}
              </div>
            </div>
          )}
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
