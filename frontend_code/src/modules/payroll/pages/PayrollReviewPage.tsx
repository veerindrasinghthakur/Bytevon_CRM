import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { Select } from '@/shared/components/ui/Select'
import { ResourceName } from '@/shared/schema'
import { usePayrollReview } from '../hooks/use-payroll'
import { cn } from '@/shared/lib/cn'

export function PayrollReviewPage() {
  const navigate = useNavigate()
  const {
    emp,
    showPayModal,
    setShowPayModal,
    paymentRef,
    setPaymentRef,
    gross,
    totalEarnings,
    totalDeductions,
    netAdj,
    netPayable,
    attendanceSummary,
    earnings,
    deductions,
    adjustments,
    formatMoney,
    periodLabel,
    isLoading,
    isError,
    approveMut,
    payMut,
  } = usePayrollReview()

  if (isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading payroll review…</div>
  }
  if (isError || !emp) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">Payroll review not found.</p>
        <BackButton to="/payroll/monthly" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BackButton to="/payroll/monthly" label="" className="!px-2" />
            <h1 className="text-headline-lg font-semibold text-on-surface m-0">Payroll Review</h1>
            <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm flex items-center gap-1 ml-2">
              <span className="material-symbols-outlined text-[16px]">pending_actions</span>
              {emp.status.toUpperCase()}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm text-on-surface-variant ml-12">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span className="font-medium text-on-surface">{emp.name}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              {emp.code}
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">work</span>
              {emp.department}
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span className="font-medium">{periodLabel}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-2 ml-12 md:ml-0">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">print</span>}>
            Print
          </Button>
          <ExportButton resource={ResourceName.PAYROLL} filenameStem={`payroll-review-${emp.code}`} label="Export" />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Salary" value={formatMoney(gross)} hint="Base package" icon="payments" iconBg="bg-surface-container text-secondary" />
        <MetricCard
          title="Total Earnings"
          value={formatMoney(totalEarnings)}
          hint={
            <span className="text-[#166534] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span> Includes allowances
            </span>
          }
          icon="trending_up"
          iconBg="bg-[#dcfce7] text-[#166534]"
        />
        <MetricCard
          title="Total Deductions"
          value={`-${formatMoney(totalDeductions)}`}
          hint="Taxes & benefits"
          icon="trending_down"
          iconBg="bg-error-container text-on-error-container"
        />
        <div className="bg-deep-navy border border-deep-navy rounded-lg p-6 executive-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <h3 className="text-body-sm text-inverse-primary">Net Payable</h3>
            <div className="p-2 bg-white/10 rounded-lg text-white">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-headline-lg font-semibold text-white">{formatMoney(netPayable)}</div>
            <div className="text-body-sm text-inverse-primary mt-1">Final transfer amount</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center bg-surface-bright">
              <h2 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                Attendance Summary
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
              {attendanceSummary.map(([l, v]) => (
                <div key={l} className="bg-surface p-4 rounded-lg border border-surface-variant card-hover">
                  <div className="text-body-sm text-on-surface-variant mb-1">{l}</div>
                  <div className="text-title-lg font-semibold text-on-surface">{v}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bv-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright">
              <h2 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">receipt_long</span>
                Salary Breakdown
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-outline-variant">
              <div className="p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Earnings</h3>
                <ul className="space-y-4">
                  {earnings.map((e) => (
                    <li key={e.name} className="flex justify-between items-center text-body-md">
                      <span className="text-on-surface">{e.name}</span>
                      <span className="font-medium text-on-surface">{formatMoney(e.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
                  <span className="text-label-md text-on-surface-variant">Gross Earnings</span>
                  <span className="text-title-lg font-semibold text-on-surface">{formatMoney(totalEarnings)}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Deductions</h3>
                <ul className="space-y-4">
                  {deductions.map((d) => (
                    <li key={d.name} className="flex justify-between items-center text-body-md">
                      <span className="text-on-surface">{d.name}</span>
                      <span className="font-medium text-on-surface">{formatMoney(d.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
                  <span className="text-label-md text-on-surface-variant">Total Deductions</span>
                  <span className="text-title-lg font-semibold text-on-surface">-{formatMoney(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">tune</span>
              Adjustments
            </h3>
            <div className="space-y-3">
              {adjustments.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">No adjustments</p>
              ) : (
                adjustments.map((adj) => (
                  <div key={adj.id} className="bg-surface p-3 rounded border border-surface-variant flex justify-between items-start">
                    <div>
                      <div className="font-medium text-body-md text-on-surface">{adj.title}</div>
                      <div className="text-body-sm text-on-surface-variant mt-1">{adj.detail}</div>
                    </div>
                    <div
                      className={
                        adj.amount >= 0
                          ? 'font-medium text-body-md text-[#166534] bg-[#dcfce7] px-2 py-1 rounded'
                          : 'font-medium text-body-md text-on-error-container bg-error-container px-2 py-1 rounded'
                      }
                    >
                      {adj.amount >= 0 ? '+' : ''}
                      {formatMoney(adj.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center">
              <span className="text-label-md text-on-surface-variant">Net Adjustments</span>
              <span className="text-title-lg font-semibold text-on-surface">
                {netAdj >= 0 ? '+' : ''}
                {formatMoney(netAdj)}
              </span>
            </div>
          </section>

          <section className="bv-surface overflow-hidden flex flex-col">
            <div className="p-6 flex-grow">
              <h3 className="text-title-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">calculate</span>
                Final Calculation
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Gross Earnings</span>
                  <span className="font-medium">{formatMoney(totalEarnings)}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Total Deductions</span>
                  <span className="font-medium">-{formatMoney(totalDeductions)}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Net Adjustments</span>
                  <span className="font-medium">
                    {netAdj >= 0 ? '+' : ''}
                    {formatMoney(netAdj)}
                  </span>
                </div>
              </div>
              <div className="bg-surface-container p-4 rounded-lg border border-secondary-fixed">
                <div className="text-body-sm text-on-surface-variant mb-1 font-medium">Net Payable</div>
                <div className="text-display-lg font-bold text-on-surface tracking-tight">{formatMoney(netPayable)}</div>
              </div>
            </div>
            <div className="p-6 bg-surface-bright border-t border-outline-variant flex flex-col gap-3">
              <button
                type="button"
                className="w-full bg-deep-navy text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 executive-shadow disabled:opacity-50"
                disabled={approveMut.isPending || emp.status === 'Approved' || emp.status === 'Paid'}
                onClick={() => approveMut.mutate()}
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {approveMut.isPending ? 'Approving…' : 'Approve Payroll'}
              </button>
              <button
                type="button"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-medium py-3 px-4 rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                Request Correction
              </button>
              <button
                type="button"
                className="w-full border border-primary text-primary font-medium py-3 px-4 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={emp.status === 'Paid'}
                onClick={() => setShowPayModal(true)}
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Record Payment
              </button>
            </div>
          </section>
        </div>
      </div>

      {showPayModal && (
        <RecordPaymentModal
          employeeName={emp.name}
          employeeCode={emp.code}
          role={emp.role}
          amount={netPayable}
          paymentRef={paymentRef}
          setPaymentRef={setPaymentRef}
          isPending={payMut.isPending}
          onClose={() => setShowPayModal(false)}
          onConfirm={() => {
            payMut.mutate(paymentRef || undefined, {
              onSuccess: () => {
                setShowPayModal(false)
                navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: emp.id } })
              },
            })
          }}
        />
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  hint,
  icon,
  iconBg,
}: {
  title: string
  value: string
  hint: React.ReactNode
  icon: string
  iconBg: string
}) {
  return (
    <div className="bv-surface card-hover p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-body-sm text-on-surface-variant">{title}</h3>
        <div className={cn('p-2 rounded-lg', iconBg)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-headline-md font-semibold text-on-surface">{value}</div>
        <div className="text-body-sm text-on-surface-variant mt-1">{hint}</div>
      </div>
    </div>
  )
}

function RecordPaymentModal({
  employeeName,
  employeeCode,
  role,
  amount,
  paymentRef,
  setPaymentRef,
  isPending,
  onClose,
  onConfirm,
}: {
  employeeName: string
  employeeCode: string
  role: string
  amount: number
  paymentRef: string
  setPaymentRef: (v: string) => void
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [method, setMethod] = useState('bank_transfer')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bv-surface executive-shadow w-full max-w-2xl flex flex-col overflow-hidden z-10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant">
          <h2 className="text-title-lg font-semibold text-on-surface">Record Payroll Payment</h2>
          <button type="button" className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-surface flex-1">
          <div className="bg-surface-container-low rounded-lg p-5 border border-outline-variant mb-6 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Employee</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-medium">
                  {employeeName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-body-md font-medium text-on-surface">{employeeName}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {employeeCode} • {role}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block w-px bg-outline-variant h-12 self-center" />
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Payroll Month</p>
              <p className="text-body-md text-on-surface font-medium">August 2026</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Method</label>
              <Select
                value={method}
                onChange={setMethod}
                options={[
                  { value: 'neft', label: 'NEFT' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'other', label: 'Other' },
                ]}
                className="w-full"
                minWidthClass="min-w-0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label-md text-on-surface">Payment Date</label>
              <input type="date" defaultValue="2026-08-31" className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-md py-2.5 px-3 focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-label-md text-on-surface">Payment Reference (UTR / Txn ID)</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. HDFC000123456789"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-md py-2.5 px-3 focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant">
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-electric-blue mt-0.5">info</span>
                <div>
                  <p className="text-label-md text-on-surface mb-1">Verify payment details</p>
                  <p className="text-body-sm text-on-surface-variant">
                    Verify the payment amount and payment reference before marking this payroll as paid.
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Amount to be Paid</p>
                <p className="text-headline-md font-semibold text-primary">{formatMoney(amount)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3">
          <button
            type="button"
            className="px-5 py-2.5 rounded font-medium text-on-surface-variant border border-outline-variant hover:bg-surface-container-highest transition-colors"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded font-medium text-on-primary bg-electric-blue hover:bg-secondary transition-colors flex items-center gap-2 executive-shadow disabled:opacity-50"
            onClick={onConfirm}
            disabled={isPending}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            {isPending ? 'Saving…' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  )
}
