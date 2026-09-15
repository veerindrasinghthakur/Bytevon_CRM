import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useLeaveEdit } from '../context/LeaveEditContext'
import { listLeaveTypeSettings } from '../api/leave'
import { getLeaveAccrualPolicy, updateLeaveAccrualPolicy } from '../api/settings'
import { queryKeys } from '@/shared/lib/query-keys'
import { leaveAccrualPolicySchema, type LeaveAccrualPolicyInput } from '../schemas/leave'
import { leavePolicyFormSchema, type LeavePolicyFormInput } from '../schemas/leave-form'

/** Content only — pencil Edit lives on Accrual Policy section */
export function LeaveSettingsPage() {
  const { editing, setEditing } = useLeaveEdit()
  const qc = useQueryClient()
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: leaveTypes = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.leave.policies(),
    queryFn: listLeaveTypeSettings,
  })

  const { data: accrualData, isLoading: accrualLoading, isError: accrualIsError, error: accrualError } =
    useQuery({
      queryKey: queryKeys.admin.settings.leaveAccrual(),
      queryFn: getLeaveAccrualPolicy,
    })

  const accrualForm = useForm<LeaveAccrualPolicyInput>({
    resolver: zodResolver(leaveAccrualPolicySchema),
    defaultValues: { maxCarryOverDays: 0, minimumNoticeDays: 0 },
  })

  const modalForm = useForm<LeavePolicyFormInput>({
    resolver: zodResolver(leavePolicyFormSchema),
    defaultValues: {
      name: '',
      leave_type: '',
      annual_entitlement: 10,
      carry_forward_limit: 0,
      effective_from: '',
      effective_to: '',
    },
  })

  useEffect(() => {
    if (accrualData && !editing) {
      accrualForm.reset({
        maxCarryOverDays: accrualData.maxCarryOverDays,
        minimumNoticeDays: accrualData.minimumNoticeDays,
      })
    }
  }, [accrualData, editing, accrualForm])

  const saveAccrual = useMutation({
    mutationFn: () => updateLeaveAccrualPolicy(accrualForm.getValues()),
    onSuccess: () => {
      setSaveError(null)
      qc.invalidateQueries({ queryKey: queryKeys.admin.settings.leaveAccrual() })
    },
    onError: (e: unknown) => {
      setSaveError(getApiErrorMessage(e, 'Could not save accrual policy'))
      setEditing(true)
    },
  })

  useEffect(() => {
    if (!editing && accrualForm.formState.isDirty) {
      saveAccrual.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when edit flag drops
  }, [editing])

  const [modalOpen, setModalOpen] = useState(false)

  const onModalSubmit = (values: LeavePolicyFormInput) => {
    // TODO: call create leave type API
    console.log('Create leave type:', values)
    setModalOpen(false)
    modalForm.reset()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {saveError && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {saveError}
        </div>
      )}
      {(isError || accrualIsError) && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error flex flex-wrap items-center gap-3">
          <span>
            {isError
              ? getApiErrorMessage(error, 'Could not load leave types')
              : getApiErrorMessage(accrualError, 'Could not load accrual policy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

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
          {accrualLoading ? (
            <p className="text-body-sm text-on-surface-variant">Loading policy…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Max Carry-over (Days)</label>
                {editing ? (
                  <input
                    type="number"
                    {...accrualForm.register('maxCarryOverDays', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-body-md transition-colors"
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-surface">{accrualForm.watch('maxCarryOverDays')} days</p>
                )}
                {accrualForm.formState.errors.maxCarryOverDays && (
                  <p className="text-caption text-error mt-1">{accrualForm.formState.errors.maxCarryOverDays.message}</p>
                )}
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Minimum notice</label>
                {editing ? (
                  <input
                    type="number"
                    {...accrualForm.register('minimumNoticeDays', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-body-md transition-colors"
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-surface">{accrualForm.watch('minimumNoticeDays')} days</p>
                )}
                {accrualForm.formState.errors.minimumNoticeDays && (
                  <p className="text-caption text-error mt-1">{accrualForm.formState.errors.minimumNoticeDays.message}</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <Modal title="Add Leave Type" onClose={() => setModalOpen(false)}>
          <form onSubmit={modalForm.handleSubmit(onModalSubmit)} className="space-y-4">
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                Leave Type Name
              </label>
              <input
                {...modalForm.register('name')}
                placeholder="Leave type name"
                className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
              />
              {modalForm.formState.errors.name && (
                <p className="text-caption text-error mt-1">{modalForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Annual Entitlement
                </label>
                <input
                  type="number"
                  {...modalForm.register('annual_entitlement', { valueAsNumber: true })}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Carry Forward Limit
                </label>
                <input
                  type="number"
                  {...modalForm.register('carry_forward_limit', { valueAsNumber: true })}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                Effective From
              </label>
              <input
                type="date"
                {...modalForm.register('effective_from')}
                className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
