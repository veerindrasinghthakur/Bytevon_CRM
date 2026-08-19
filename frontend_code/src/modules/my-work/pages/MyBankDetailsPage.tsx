import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { currentUser } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export interface BankDetailsForm {
  accountHolderName: string
  bankName: string
  accountNumber: string
  confirmAccountNumber: string
  ifscOrRouting: string
  branchName: string
  accountType: 'Savings' | 'Current' | 'Salary'
  country: string
  currency: string
}

const EMPTY_FORM: BankDetailsForm = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscOrRouting: '',
  branchName: '',
  accountType: 'Salary',
  country: 'India',
  currency: 'INR',
}

/** Seeded as existing employee bank details (mock). Set null to demo empty/create. */
const INITIAL_SAVED: BankDetailsForm | null = {
  accountHolderName: 'Alex Rivera',
  bankName: 'HDFC Bank',
  accountNumber: '50100234567890',
  confirmAccountNumber: '50100234567890',
  ifscOrRouting: 'HDFC0001234',
  branchName: 'Koramangala, Bengaluru',
  accountType: 'Salary',
  country: 'India',
  currency: 'INR',
}

function maskAccount(num: string) {
  if (!num || num.length < 4) return '••••'
  return `•••• •••• ${num.slice(-4)}`
}

export function MyBankDetailsPage() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState<BankDetailsForm | null>(INITIAL_SAVED)
  const [draft, setDraft] = useState<BankDetailsForm>(INITIAL_SAVED ?? EMPTY_FORM)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof BankDetailsForm, string>>>({})
  const [toast, setToast] = useState<string | null>(null)

  const isCreate = !saved

  const fieldClass = (disabled: boolean) =>
    cn(
      'w-full rounded-lg border px-3 py-2.5 text-body-md outline-none transition-colors',
      disabled
        ? 'bg-surface-container-low border-outline-variant text-deep-navy cursor-default'
        : 'bg-surface-container-lowest border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30 text-deep-navy'
    )

  const validate = (data: BankDetailsForm) => {
    const next: Partial<Record<keyof BankDetailsForm, string>> = {}
    if (!data.accountHolderName.trim()) next.accountHolderName = 'Required'
    if (!data.bankName.trim()) next.bankName = 'Required'
    if (!data.accountNumber.trim()) next.accountNumber = 'Required'
    if (data.accountNumber !== data.confirmAccountNumber) {
      next.confirmAccountNumber = 'Account numbers do not match'
    }
    if (!data.ifscOrRouting.trim()) next.ifscOrRouting = 'Required'
    if (!data.branchName.trim()) next.branchName = 'Required'
    return next
  }

  const startEdit = () => {
    setDraft(saved ?? { ...EMPTY_FORM, accountHolderName: `${currentUser.firstName}` })
    setErrors({})
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(saved ?? EMPTY_FORM)
    setErrors({})
    setIsEditing(false)
  }

  const save = () => {
    const nextErrors = validate(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaved({ ...draft, confirmAccountNumber: draft.accountNumber })
    setIsEditing(false)
    setToast(isCreate ? 'Bank details saved successfully.' : 'Bank details updated successfully.')
    window.setTimeout(() => setToast(null), 2800)
  }

  const statusLabel = useMemo(() => {
    if (!saved) return 'Not set'
    return 'On file'
  }, [saved])

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

      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
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
            <p className="text-body-md text-on-surface-variant mt-1">
              Manage the account used for salary disbursement. Only you can create or update these details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing && saved && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
              onClick={startEdit}
            >
              Edit
            </Button>
          )}
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
                onClick={save}
              >
                {isCreate ? 'Save' : 'Save changes'}
              </Button>
            </>
          )}
        </div>
      </header>

      {toast && (
        <div className="rounded-lg border border-success-emerald/30 bg-success-emerald/10 px-4 py-3 text-label-md text-success-emerald flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {toast}
        </div>
      )}

      <section className="bv-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
            {currentUser.firstName.slice(0, 1)}
          </div>
          <div>
            <p className="text-title-lg font-semibold text-deep-navy">{currentUser.firstName}</p>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant mt-0.5">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                {currentUser.employeeId}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span>{currentUser.department}</span>
            </div>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
            saved
              ? 'bg-success-emerald/10 text-success-emerald border-success-emerald/20'
              : 'bg-surface-container text-on-surface-variant border-outline-variant'
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
            Add your salary account so payroll can transfer payments securely. Only you can create or change this information.
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
        <section className="bv-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <h2 className="text-title-lg font-semibold text-deep-navy flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">account_balance</span>
              {isEditing ? (isCreate ? 'Add bank account' : 'Edit bank account') : 'Salary account'}
            </h2>
            {!isEditing && (
              <button
                type="button"
                className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors"
                onClick={startEdit}
                title="Edit"
                aria-label="Edit bank details"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              label="Account holder name"
              required
              error={errors.accountHolderName}
            >
              {isEditing ? (
                <input
                  className={fieldClass(false)}
                  value={draft.accountHolderName}
                  onChange={(e) => setDraft((d) => ({ ...d, accountHolderName: e.target.value }))}
                  placeholder="Name as on bank account"
                />
              ) : (
                <p className="text-body-md font-medium text-deep-navy">{saved?.accountHolderName}</p>
              )}
            </Field>

            <Field label="Bank name" required error={errors.bankName}>
              {isEditing ? (
                <input
                  className={fieldClass(false)}
                  value={draft.bankName}
                  onChange={(e) => setDraft((d) => ({ ...d, bankName: e.target.value }))}
                  placeholder="e.g. HDFC Bank"
                />
              ) : (
                <p className="text-body-md font-medium text-deep-navy">{saved?.bankName}</p>
              )}
            </Field>

            <Field label="Account number" required error={errors.accountNumber}>
              {isEditing ? (
                <input
                  className={fieldClass(false)}
                  value={draft.accountNumber}
                  onChange={(e) => setDraft((d) => ({ ...d, accountNumber: e.target.value.replace(/\s/g, '') }))}
                  placeholder="Enter account number"
                  autoComplete="off"
                />
              ) : (
                <p className="text-body-md font-medium text-deep-navy font-mono tracking-wide">
                  {maskAccount(saved?.accountNumber ?? '')}
                </p>
              )}
            </Field>

            {isEditing && (
              <Field label="Confirm account number" required error={errors.confirmAccountNumber}>
                <input
                  className={fieldClass(false)}
                  value={draft.confirmAccountNumber}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, confirmAccountNumber: e.target.value.replace(/\s/g, '') }))
                  }
                  placeholder="Re-enter account number"
                  autoComplete="off"
                />
              </Field>
            )}

            <Field label="IFSC / Routing code" required error={errors.ifscOrRouting}>
              {isEditing ? (
                <input
                  className={fieldClass(false)}
                  value={draft.ifscOrRouting}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, ifscOrRouting: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. HDFC0001234"
                />
              ) : (
                <p className="text-body-md font-medium text-deep-navy font-mono">{saved?.ifscOrRouting}</p>
              )}
            </Field>

            <Field label="Branch" required error={errors.branchName}>
              {isEditing ? (
                <input
                  className={fieldClass(false)}
                  value={draft.branchName}
                  onChange={(e) => setDraft((d) => ({ ...d, branchName: e.target.value }))}
                  placeholder="Branch name / city"
                />
              ) : (
                <p className="text-body-md font-medium text-deep-navy">{saved?.branchName}</p>
              )}
            </Field>

            <Field label="Account type">
              {isEditing ? (
                <select
                  className={fieldClass(false)}
                  value={draft.accountType}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      accountType: e.target.value as BankDetailsForm['accountType'],
                    }))
                  }
                >
                  <option value="Salary">Salary</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              ) : (
                <p className="text-body-md font-medium text-deep-navy">{saved?.accountType}</p>
              )}
            </Field>

            <Field label="Country">
              {isEditing ? (
                <input
                  className={fieldClass(false)}
                  value={draft.country}
                  onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                />
              ) : (
                <p className="text-body-md font-medium text-deep-navy">{saved?.country}</p>
              )}
            </Field>

            <Field label="Currency">
              {isEditing ? (
                <select
                  className={fieldClass(false)}
                  value={draft.currency}
                  onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
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
                  Account number is masked for security. Use <strong className="text-deep-navy">Edit</strong> to update
                  any field. Changes apply to future payroll runs only.
                </span>
              </div>
            </div>
          )}
        </section>
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
