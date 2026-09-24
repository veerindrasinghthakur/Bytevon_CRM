import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../../routes'
import { cn } from '@/shared/lib/cn'
import { maskAccount } from '../../lib/maskAccount'
import { useMyBankDetails } from '../../hooks/use-my-bank-details'

export function MyBankDetailsPage() {
  const navigate = useNavigate()

  const { saved, isLoading } = useMyBankDetails()

  const statusLabel = saved ? 'On file' : 'Not set'

  if (isLoading) {
    return <div className="animate-fade-in">Loading...</div>
  }

  return (
    <div className="space-y-8 max-w-[960px] animate-fade-in">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-md">
        <button
          type="button"
          className="hover:text-secondary transition-colors"
          onClick={() => safeNavigate(navigate, { to: myWorkRoutes.root })}
        >
          My Work
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-background font-medium">Bank Details</span>
      </div>

      <PageHeader
        title="Bank Details"
        description="View the account used for your salary disbursement."
        showBack
        backTo={myWorkRoutes.root}
      />

      <section className="bv-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-on-surface-variant hover:text-secondary p-1 rounded-full hover:bg-surface-container transition-colors mt-0.5"
            onClick={() => safeNavigate(navigate, { to: myWorkRoutes.root })}
            aria-label="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-headline-lg font-semibold text-on-background">Bank Details</h1>
            <span
              className={cn(
                'inline-flex mt-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold',
                saved
                  ? 'bg-secondary/15 text-secondary'
                  : 'bg-surface-container-high text-on-surface-variant',
              )}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </section>

      <section className="bv-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
            {saved?.accountHolderName?.slice(0, 1) ?? 'U'}
          </div>
          <div>
            <p className="text-title-lg font-semibold text-on-background">
              {saved?.accountHolderName ?? 'Current User'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant mt-0.5">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                Employee
              </span>
            </div>
          </div>
        </div>
      </section>

      {!saved && (
        <section className="bv-surface border-dashed p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px] text-secondary">account_balance</span>
          </div>
          <h2 className="text-title-lg font-semibold text-on-background mb-2">No bank details yet</h2>
          <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-6">
            Your salary account has not been set up yet. Contact HR or payroll to add your bank details.
          </p>
        </section>
      )}

      {saved && (
        <section className="bv-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <h2 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">account_balance</span>
              Salary account
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Account holder name">
              <p className="text-body-md font-medium text-on-background">{saved?.accountHolderName}</p>
            </Field>
            <Field label="Bank name">
              <p className="text-body-md font-medium text-on-background">{saved?.bankName}</p>
            </Field>
            <Field label="Account number">
              <p className="text-body-md font-medium text-on-background font-mono">
                {maskAccount(saved?.accountNumber ?? '')}
              </p>
            </Field>
            <Field label="IFSC / Routing code">
              <p className="text-body-md font-medium text-on-background font-mono">{saved?.ifscOrRouting}</p>
            </Field>
            <Field label="Branch">
              <p className="text-body-md text-on-surface-variant">{saved?.branch ?? '—'}</p>
            </Field>
            <Field label="Account type">
              <p className="text-body-md text-on-surface-variant">{saved?.accountType ?? '—'}</p>
            </Field>
            <Field label="UPI ID">
              <p className="text-body-md text-on-surface-variant">{saved?.upiId ?? '—'}</p>
            </Field>
            <Field label="PAN">
              <p className="text-body-md text-on-surface-variant">{saved?.pan ?? '—'}</p>
            </Field>
          </div>
        </section>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm text-on-surface-variant">{label}</label>
      {children}
    </div>
  )
}
