import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { invalidate, queryKeys } from '@/shared/lib/query-keys'
import {
  createLeaveType,
  getLeaveType,
  softDeleteLeaveType,
  updateLeaveType,
} from '../../api/leave'
import {
  emptyLeaveTypeMasterForm,
  leaveTypeMasterFormSchema,
  type LeaveTypeMasterFormInput,
} from '../../schemas/leave-form'

const LIST_TO = '/admin/leave-settings'

const FLAG_FIELDS = [
  { key: 'is_paid', label: 'Paid leave', hint: 'Counts against balance; unpaid skips balance checks' },
  { key: 'requires_approval', label: 'Requires approval', hint: 'Requests route through the approval workflow' },
  { key: 'requires_document', label: 'Requires document', hint: 'Supporting document expected with requests' },
  { key: 'allow_half_day', label: 'Allow half day', hint: 'Employees may apply for half-day spans' },
  { key: 'allow_hourly', label: 'Allow hourly', hint: 'Hour-level granularity permitted' },
  { key: 'is_encashable', label: 'Encashable', hint: 'Unused balance may be encashed' },
] as const

export function LeaveTypeFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const params = useParams({ strict: false }) as { typeId?: string }
  const isNew = params.typeId == null
  const id = Number(params.typeId)

  const detailQuery = useQuery({
    queryKey: queryKeys.admin.leave.types({ id }),
    queryFn: () => getLeaveType(id),
    enabled: !isNew && Number.isFinite(id),
  })

  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(isNew)

  const form = useForm<LeaveTypeMasterFormInput>({
    resolver: zodResolver(leaveTypeMasterFormSchema),
    defaultValues: emptyLeaveTypeMasterForm(),
  })

  useEffect(() => {
    const row = detailQuery.data
    if (row && !isEditing) {
      form.reset({
        code: row.code,
        name: row.name,
        description: row.description ?? '',
        is_paid: row.is_paid,
        requires_approval: row.requires_approval,
        requires_document: row.requires_document,
        allow_half_day: row.allow_half_day,
        allow_hourly: row.allow_hourly,
        is_encashable: row.is_encashable,
        default_annual_entitlement: row.default_annual_entitlement,
        is_active: row.is_active,
        sort_order: row.sort_order,
      })
    }
  }, [detailQuery.data, isEditing, form])

  const saveMut = useMutation({
    mutationFn: (values: LeaveTypeMasterFormInput) => {
      if (isNew) return createLeaveType(values)
      const { code: _ignored, ...patch } = values
      void _ignored
      return updateLeaveType(id, patch)
    },
    onSuccess: async (row) => {
      await invalidate.adminLeave(qc)
      if (isNew) {
        safeNavigate(navigate, {
          to: '/admin/leave-settings/types/$typeId',
          params: { typeId: String(row.id) },
        })
      } else {
        finishEditing()
        await detailQuery.refetch()
      }
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => softDeleteLeaveType(id),
    onSuccess: async () => {
      await invalidate.adminLeave(qc)
      safeNavigate(navigate, { to: LIST_TO })
    },
  })

  if (!isNew && detailQuery.isLoading) return <PageLoadingSkeleton />
  if (!isNew && (detailQuery.isError || !detailQuery.data)) {
    return (
      <ErrorState
        description={getApiErrorMessage(detailQuery.error, 'Leave type not found')}
        onRetry={() => void detailQuery.refetch()}
        onBack={() => safeNavigate(navigate, { to: LIST_TO })}
      />
    )
  }

  const row = detailQuery.data
  const inputCls =
    'w-full mt-1 border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-white transition-colors'

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={LIST_TO} label="Back to leave types" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">
            {isNew ? 'Add leave type' : (row?.name ?? 'Leave type')}
          </h2>
          {!isNew && row && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              {row.code} · {row.default_annual_entitlement} days/year ·{' '}
              <span className={row.deleted_at ? 'text-error' : 'text-secondary'}>
                {row.deleted_at ? 'Deleted' : row.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            {!isNew && (
              <Button variant="outline" size="sm" onClick={() => cancelEditing()}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              isLoading={saveMut.isPending}
              onClick={() => void form.handleSubmit((v) => saveMut.mutate(v))()}
            >
              {isNew ? 'Create' : 'Save'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {!isNew && row && !row.deleted_at && <EditButton variant="outline" onClick={startEditing} />}
            {!isNew && row && !row.deleted_at && (
              <DeleteButton
                iconOnly
                entityLabel={row.name}
                isLoading={deleteMut.isPending}
                onConfirm={() => {
                  void deleteMut.mutateAsync()
                }}
              />
            )}
          </div>
        )}
      </div>

      {(saveMut.isError || deleteMut.isError) && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {getApiErrorMessage(
            saveMut.error ?? deleteMut.error,
            'Could not save leave type',
          )}
        </div>
      )}

      <div className="bv-surface p-6 max-w-2xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase">Code</label>
            {isEditing && isNew ? (
              <input {...form.register('code')} placeholder="e.g. STUDY" className={inputCls} />
            ) : (
              <p className="text-body-md font-medium mt-1">{row?.code}</p>
            )}
            {form.formState.errors.code && (
              <p className="text-caption text-error mt-1">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase">Name</label>
            {isEditing ? (
              <input {...form.register('name')} placeholder="e.g. Study" className={inputCls} />
            ) : (
              <p className="text-body-md font-medium mt-1">{row?.name}</p>
            )}
            {form.formState.errors.name && (
              <p className="text-caption text-error mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase">Description</label>
          {isEditing ? (
            <textarea {...form.register('description')} rows={2} className={inputCls} />
          ) : (
            <p className="text-body-md mt-1">{row?.description || '—'}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase">Default days / year</label>
            {isEditing ? (
              <input
                type="number"
                min={0}
                step="0.5"
                {...form.register('default_annual_entitlement', { valueAsNumber: true })}
                className={inputCls}
              />
            ) : (
              <p className="text-body-md font-medium mt-1">{row?.default_annual_entitlement}</p>
            )}
            {form.formState.errors.default_annual_entitlement && (
              <p className="text-caption text-error mt-1">
                {form.formState.errors.default_annual_entitlement.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase">Sort order</label>
            {isEditing ? (
              <input
                type="number"
                step={1}
                {...form.register('sort_order', { valueAsNumber: true })}
                className={inputCls}
              />
            ) : (
              <p className="text-body-md font-medium mt-1">{row?.sort_order}</p>
            )}
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-bold text-on-surface-variant uppercase mb-2">Rules</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FLAG_FIELDS.map((f) => (
              <label
                key={f.key}
                className={
                  isEditing
                    ? 'flex items-start gap-3 rounded-lg border border-outline-variant p-3 cursor-pointer'
                    : 'flex items-start gap-3 p-1'
                }
              >
                <input
                  type="checkbox"
                  {...form.register(f.key)}
                  disabled={!isEditing}
                  className="mt-1 size-4 accent-[var(--color-secondary)]"
                />
                <span>
                  <span className="block text-body-sm font-medium text-on-surface">{f.label}</span>
                  <span className="block text-caption text-on-surface-variant">{f.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...form.register('is_active')}
            disabled={!isEditing}
            className="size-4 accent-[var(--color-secondary)]"
          />
          <span className="text-body-sm font-medium text-on-surface">
            Active (inactive types cannot be used for new policies or requests)
          </span>
        </label>
      </div>
    </div>
  )
}
