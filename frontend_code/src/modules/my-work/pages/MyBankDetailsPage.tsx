import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { useBankDetails } from '../hooks/use-bank-details'
import { cn } from '@/shared/lib/cn'
import type { BankFormValues } from '../schemas/bank-form'

function maskAccount(num: string) {
  if (!num || num.length < 4) return '\u2022\u2022\u2022\u2022'
  return `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${num.slice(-4)}`
}

export function MyBankDetailsPage() {
  const navigate = useNavigate()
  const { isLoading, saved, save, isSaving, emptyForm, formSchema } = useBankDetails()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BankFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyForm,
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
      reset({ ...emptyForm })
    }
    setIsEditing(true)
  }

  const cancelEdit = () => {
    reset(saved ? { ...saved, confirmAccountNumber: saved.accountNumber } : emptyForm)
    setIsEditing(false)
  }

  const onSubmit = async (data: BankFormValues) => {
    await save.mutateAsync(data)
    setIsEditing(false)
    setToast(isCreate ? 'Bank details saved successfully.' : 'Bank details updated successfully.')
    setTimeout(() => setToast(null), 2800)
  }

  const statusLabel = saved ? 'On file' : 'Not set'

  const fieldClass = (disabled: boolean) =>
    cn(
      'w-full rounded-lg border px-3 py-2.5 text-body-md outline-none transition-colors',
      disabled
        ? 'bg-surface-container-low border-outline-variant text-deep-navy cursor-default'
        : 'bg-surface-container-lowest border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 text-deep-navy',
    )

  if (isLoading) {
    return <div className="animate-fade-in">Loading...</div>
  }

  return (
    <div className="space-y-8 max-w-[960px] animate-fade-in">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-md">
        <button
          type="button"
          className="hover:text-secondary transition-colors"
          onClick={() => navigate({ to: '/my-work' })}
        >
          My Work
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-deep-navy font-medium">Bank Details</span>
      </div>

      <PageHeader
        title="Bank Details"
        description="Manage the account used for salary disbursement. Only you can create or update these details."
        showBack
        backTo="/my-work"
      />

      {toast && (
        <div className="rounded-lg border border-success-emerald/30 bg-success-emerald/10 px-4 py-3 text-label-md text-success-emerald flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {toast}
        </div>
      )}

      <section className="bv-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-on-surface-variant hover:text-secondary p-1 rounded-full hover:bg-surface-container transition-colors mt-0.5"
            onClick={() => navigate({ to: '/my-work' })}
            aria-label="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-headline-lg font-semibold text-deep-navy">Bank Details</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing && !saved && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
              onClick={startEdit}
            >
              Add bank details
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
                onClick={() => handleSubmit(onSubmit)()}
              >
                {isCreate ? 'Save' : 'Save changes'}
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="bv-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
            {saved?.accountHolderName?.slice(0, 1) ?? 'U'}
          </div>
          <div>
            <p className="text-title-lg font-semibold text-deep-navy">{saved?.accountHolderName ?? 'Current User'}</p>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant mt-0.5">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                Employee
              </span>
            </div>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
            saved
              ? 'bg-success-emerald/10 text-success-emerald border-success-emerald/20'
              : 'bg-surface-container text-on-surface-variant border-outline-variant',
          )}
        >
          {statusLabel}
        </span>
      </section>

      {!saved && !isEditing && (
        <section className="bv-surface border-dashed p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px] text-secondary">account_balance</span>
          </div>
          <h2 className="text-title-lg font-semibold text-deep-navy mb-2">No bank details yet</h2>
          <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-6">
            Add your salary account so payroll can transfer payments securely.
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
              <h2 className="text-title-lg font-semibold text-deep-navy flex items-center gap-2">
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
                  <p className="text-body-md font-medium text-deep-navy">{saved?.accountHolderName}</p>
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
                  <p className="text-body-md font-medium text-deep-navy">{saved?.bankName}</p>
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
                  <p className="text-body-md font-medium text-deep-navy font-mono tracking-wide">
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
                  <p className="text-body-md font-medium text-deep-navy font-mono">{saved?.ifscOrRouting}</p>
                )}
              </Field>

              <Field label="Branch" required error={errors.branchName?.message}>
                {isEditing ? (
                  <input
                    {...register('branchName')}
                    className={fieldClass(false)}
                    placeholder="Branch name / city"
                  />
                ) : (
                  <p className="text-body-md font-medium text-deep-navy">{saved?.branchName}</p>
                )}
              </Field>

              <Field label="Account type">
                {isEditing ? (
                  <Select
                    {...register('accountType')}
                    options={[
                      { value: 'Salary', label: 'Salary' },
                      { value: 'Savings', label: 'Savings' },
                      { value: 'Current', label: 'Current' },
                    ]}
                    minWidthClass="w-full"
                  />
                ) : (
                  <p className="text-body-md font-medium text-deep-navy">{saved?.accountType}</p>
                )}
              </Field>

              <Field label="Country">
                {isEditing ? (
                  <input {...register('country')} className={fieldClass(false)} />
                ) : (
                  <p className="text-body-md font-medium text-deep-navy">{saved?.country}</p>
                )}
              </Field>

              <Field label="Currency">
                {isEditing ? (
                  <Select
                    {...register('currency')}
                    options={[
                      { value: 'INR', label: 'INR' },
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'GBP', label: 'GBP' },
                    ]}
                    minWidthClass="w-full"
                  />
                ) : (
                  <p className="text-body-md font-medium text-deep-navy">{saved?.currency}</p>
                )}
              </Field>
            </div>

            {!isEditing && saved && (
              <div className="px-6 pb-6">
                <div className="rounded-lg bg-surface-container-low border border-outline-variant px-4 py-3 text-label-md text-on-surface-variant flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">info</span>
                  <span>
                    Account number is masked for security. Use the pencil to update any field. Changes apply to future
                    payroll runs only.
                  </span>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting || isSaving}>
                  {isCreate ? 'Save' : 'Save changes'}
                </Button>
              </div>
            )}
          </section>
        </form>
      )}
    </div>
  )
}

import { useState } from 'react'

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
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-label-md text-on-surface-variant">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-caption text-error">{error}</p>}
    </div>
  )
}