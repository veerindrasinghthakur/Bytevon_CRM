import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { IconButton } from '@/shared/components/ui/IconButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { cn } from '@/shared/lib/cn'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useLeaveEdit } from '../../context/LeaveEditContext'
import { listLeaveTypes } from '../../api/leave'
import { getLeaveAccrualPolicy, updateLeaveAccrualPolicy } from '../../api/settings'
import { invalidate, queryKeys } from '@/shared/lib/query-keys'
import { leaveAccrualPolicySchema, type LeaveAccrualPolicyInput } from '../../schemas/leave'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { ExportButton } from '@/shared/components/export/ExportButton'

/** Content only — pencil Edit lives on Accrual Policy section */
export function LeaveSettingsPage() {
  const { editing, setEditing } = useLeaveEdit()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: leaveTypes = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.leave.types(),
    queryFn: () => listLeaveTypes(false),
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch()
              void invalidate.adminLeave(qc)
            }}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 bv-surface card-hover p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">ballot</span>
              <h3 className="text-title-lg font-semibold text-on-surface">Leave Types</h3>
            </div>
            <div className="flex gap-2">
              <ExportButton
                resource="leave_policy"
                filenameStem="leave-types"
              />
              <Can action={Action.CREATE} resource="leave_policy">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<span className="material-symbols-outlined text-[20px]">add_circle</span>}
                  onClick={() => safeNavigate(navigate, { to: '/admin/leave-settings/types/new' })}
                >
                  Add Leave Type
                </Button>
              </Can>
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <PageLoadingSkeleton />
            ) : isError ? (
              <ErrorState
                description={getApiErrorMessage(error, 'Could not load leave types')}
                onRetry={() => void refetch()}
              />
            ) : leaveTypes.length === 0 ? (
              <EmptyState
                title="No leave types yet"
                description="Add the first leave type to start assigning policies."
                actionLabel="Add Leave Type"
                onAction={() => safeNavigate(navigate, { to: '/admin/leave-settings/types/new' })}
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-outline-variant">
                    <th className="pb-3 text-label-md text-on-surface-variant">Leave Type</th>
                    <th className="pb-3 text-label-md text-on-surface-variant">Paid</th>
                    <th className="pb-3 text-label-md text-on-surface-variant">Approval</th>
                    <th className="pb-3 text-label-md text-on-surface-variant">Half-day</th>
                    <th className="pb-3 text-label-md text-on-surface-variant">Default days</th>
                    <th className="pb-3 text-label-md text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {leaveTypes.map((row) => (
                    <tr
                      key={row.id}
                      className="zebra-row cursor-pointer hover:bg-surface-container-low"
                      onClick={() =>
                        safeNavigate(navigate, {
                          to: '/admin/leave-settings/types/$typeId',
                          params: { typeId: String(row.id) },
                        })
                      }
                    >
                      <td className="py-4">
                        <div className="text-body-md font-semibold text-on-surface">{row.name}</div>
                        <div className="text-label-sm text-on-surface-variant">
                          {row.code}
                          {row.description ? ` · ${row.description}` : ''}
                        </div>
                      </td>
                      <td className="py-4">
                        <FlagPill on={row.is_paid} onLabel="Paid" offLabel="Unpaid" />
                      </td>
                      <td className="py-4">
                        <FlagPill on={row.requires_approval} onLabel="Required" offLabel="Direct" />
                      </td>
                      <td className="py-4">
                        <FlagPill on={row.allow_half_day} onLabel="Yes" offLabel="No" />
                      </td>
                      <td className="py-4 text-body-md text-on-surface">
                        {row.default_annual_entitlement}
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            'flex items-center gap-1 text-label-sm font-bold',
                            row.is_active ? 'text-secondary' : 'text-on-surface-variant',
                          )}
                        >
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              row.is_active ? 'bg-secondary' : 'bg-outline-variant',
                            )}
                          />
                          {row.is_active ? 'Active' : 'Inactive'}
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
            <Can action={Action.UPDATE} resource="leave_policy">
              {!editing && (
                <IconButton label="Edit accrual policy" size="sm" onClick={() => setEditing(true)}>
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </IconButton>
              )}
            </Can>
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
    </div>
  )
}

function FlagPill({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={cn(
        'px-2 py-1 rounded text-label-sm',
        on ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-high text-on-surface-variant',
      )}
    >
      {on ? onLabel : offLabel}
    </span>
  )
}
