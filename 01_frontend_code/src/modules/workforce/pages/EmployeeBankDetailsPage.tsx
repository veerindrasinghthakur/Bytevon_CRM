import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { BackButton } from '@/shared/components/layout/BackButton'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { workforceRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'
import { maskAccount } from '@/modules/my-work/lib/maskAccount'
import { emptyBankForm, bankFormSchema, type BankFormValues } from '@/modules/my-work/schemas/bank-form'
import { getEmployeeBankDetails, saveEmployeeBankDetails } from '@/modules/workforce/api/bank'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import type { BankDetails } from '@/modules/my-work/types'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

const fieldClass = (disabled: boolean) =>
  cn(
    'w-full rounded-lg border px-3 py-2.5 text-body-md outline-none transition-colors',
    disabled
      ? 'bg-surface-container-low border-outline-variant text-on-surface cursor-default'
      : 'bg-surface-container-lowest border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 text-on-surface',
  )

export function EmployeeBankDetailsPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams({ strict: false }) as { employeeId: string }
  const id = Number(employeeId)

  const { data: saved, isLoading } = useQuery({
    queryKey: queryKeys.workforce.employees.bankDetails(id),
    queryFn: () => getEmployeeBankDetails(id),
    enabled: Boolean(id),
  })

  const qc = useQueryClient()
  const save = useMutation({
    mutationFn: (values: BankFormValues) => saveEmployeeBankDetails(id, values as BankDetails),
    onSuccess: () => {
      void invalidate.workforceEmployeeBank(qc, id)
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: emptyBankForm(),
  })

  const isCreate = !saved
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const startEdit = () => {
    if (saved) {
      reset({
        ...saved,
        confirmAccountNumber: saved.accountNumber,
      })
    } else {
      reset({ ...emptyBankForm() })
    }
    setIsEditing(true)
  }

  const cancelEdit = () => {
    reset(saved ? { ...saved, confirmAccountNumber: saved.accountNumber } : emptyBankForm())
    setIsEditing(false)
  }

  const onSubmit = async (data: BankFormValues) => {
    await save.mutateAsync(data)
    setIsEditing(false)
    setToast(isCreate ? 'Bank details saved successfully.' : 'Bank details updated successfully.')
    setTimeout(() => setToast(null), 2800)
  }

  const statusLabel = saved ? 'On file' : 'Not set'

  if (isLoading) {
    return <div className="animate-fade-in">Loading...</div>
  }

  return (
    <div className="space-y-8 max-w-[960px] animate-fade-in">
      <div>
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: workforceRoutes.employees },
            { label: 'Employees', to: workforceRoutes.employees },
            { label: 'Bank Details' },
          ]}
        />
      </div>

      <PageHeader
        title="Bank Details"
        description="Manage the salary disbursement account for this employee."
        showBack
        backTo={workforceRoutes.employeeDetail(id)}
        backLabel="Back to employee"
      />

      {toast && (
        <div className="rounded-lg border border-success-emerald/30 bg-success-emerald/10 px-4 py-3 text-label-md text-success-emerald flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {toast}
        </div>
      )}

      <section className="bv-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-headline-lg font-semibold text-on-background">Bank Details</h1>
            <span
              className={cn(
                'inline-flex mt-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold',
                saved ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-container-high text-on-surface-variant',
              )}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing && !saved && (
            <Can action={Action.CREATE} resource="employment">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
                onClick={startEdit}
              >
                Add bank details
              </Button>
            </Can>
          )}
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Can action={isCreate ? Action.CREATE : Action.UPDATE} resource="employment">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
                  onClick={() => handleSubmit(onSubmit)()}
                >
                  {isCreate ? 'Save' : 'Save changes'}
                </Button>
              </Can>
            </>
          )}
        </div>
      </section>

      <section className="bv-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
            {saved?.accountHolderName?.slice(0, 1) ?? 'U'}
          </div>
          <div>
            <p className="text-title-lg font-semibold text-on-background">{saved?.accountHolderName ?? 'Employee'}</p>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant mt-0.5">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                Employee
              </span>
            </div>
          </div>
        </div>
      </section>

      {!saved && !isEditing && (
        <section className="bv-surface border-dashed p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px] text-secondary">account_balance</span>
          </div>
          <h2 className="text-title-lg font-semibold text-on-background mb-2">No bank details yet</h2>
          <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-6">
            Add the salary account so payroll can transfer payments securely.
          </p>
          <Button
            variant="primary"
            size="md"
            leftIcon={<span className="material-symbols-outlined">add</span>}
            onClick={startEdit}
          >
            Add bank details
          </Button>
        </section>
      )}

      {(saved || isEditing) && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h2 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">account_balance</span>
                {isEditing ? (isCreate ? 'Add bank account' : 'Edit bank account') : 'Salary account'}
              </h2>
              {!isEditing && <EditButton iconOnly onClick={startEdit} title="Edit bank details" />}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Account holder name" required error={errors.accountHolderName?.message}>
                {isEditing ? (
                  <input
                    {...register('accountHolderName')}
                    className={fieldClass(false)}
                    placeholder="Name as on bank account"
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-background">{saved?.accountHolderName}</p>
                )}
              </Field>

              <Field label="Bank name" required error={errors.bankName?.message}>
                {isEditing ? (
                  <input
                    {...register('bankName')}
                    className={fieldClass(false)}
                    placeholder="e.g. HDFC Bank"
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-background">{saved?.bankName}</p>
                )}
              </Field>

              <Field label="Account number" required error={errors.accountNumber?.message}>
                {isEditing ? (
                  <input
                    {...register('accountNumber')}
                    className={fieldClass(false)}
                    placeholder="Enter account number"
                    autoComplete="off"
                    onChange={(e) => setValue('accountNumber', e.target.value.replace(/\s/g, ''))}
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-background font-mono">
                    {maskAccount(saved?.accountNumber ?? '')}
                  </p>
                )}
              </Field>

              {isEditing && (
                <Field label="Confirm account number" required error={errors.confirmAccountNumber?.message}>
                  <input
                    {...register('confirmAccountNumber')}
                    className={fieldClass(false)}
                    placeholder="Re-enter account number"
                    autoComplete="off"
                    onChange={(e) => setValue('confirmAccountNumber', e.target.value.replace(/\s/g, ''))}
                  />
                </Field>
              )}

              <Field label="IFSC / Routing code" required error={errors.ifscOrRouting?.message}>
                {isEditing ? (
                  <input
                    {...register('ifscOrRouting')}
                    className={fieldClass(false)}
                    placeholder="e.g. HDFC0001234"
                    onChange={(e) => setValue('ifscOrRouting', e.target.value.toUpperCase())}
                  />
                ) : (
                  <p className="text-body-md font-medium text-on-background font-mono">{saved?.ifscOrRouting}</p>
                )}
              </Field>

              <Field label="Branch" error={errors.branch?.message}>
                {isEditing ? (
                  <input
                    {...register('branch')}
                    className={fieldClass(false)}
                    placeholder="Branch name"
                  />
                ) : (
                  <p className="text-body-md text-on-surface-variant">{saved?.branch ?? '—'}</p>
                )}
              </Field>

              <Field label="Account type" required error={errors.accountType?.message}>
                {isEditing ? (
                  <select {...register('accountType')} className={fieldClass(false)}>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Salary">Salary</option>
                  </select>
                ) : (
                  <p className="text-body-md text-on-surface-variant">{saved?.accountType ?? '—'}</p>
                )}
              </Field>

              <Field label="UPI ID (optional)" error={errors.upiId?.message}>
                {isEditing ? (
                  <input
                    {...register('upiId')}
                    className={fieldClass(false)}
                    placeholder="e.g. name@upi"
                  />
                ) : (
                  <p className="text-body-md text-on-surface-variant">{saved?.upiId ?? '—'}</p>
                )}
              </Field>

              <Field label="PAN (optional)" error={errors.pan?.message}>
                {isEditing ? (
                  <input
                    {...register('pan')}
                    className={fieldClass(false)}
                    placeholder="ABCDE1234F"
                    onChange={(e) => setValue('pan', e.target.value.toUpperCase())}
                  />
                ) : (
                  <p className="text-body-md text-on-surface-variant">{saved?.pan ?? '—'}</p>
                )}
              </Field>
            </div>

            {isEditing && (
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-2">
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Can action={isCreate ? Action.CREATE : Action.UPDATE} resource="employment">
                  <Button variant="primary" isLoading={save.isPending} onClick={() => handleSubmit(onSubmit)()}>
                    {isCreate ? 'Save' : 'Save changes'}
                  </Button>
                </Can>
              </div>
            )}
          </section>
        </form>
      )}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm text-on-surface-variant flex items-center gap-1">
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-error mt-0.5">{error}</p>}
    </div>
  )
}