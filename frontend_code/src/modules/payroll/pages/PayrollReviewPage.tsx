import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees, formatMoney } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function PayrollReviewPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const emp = payrollEmployees.find((e) => e.id === employeeId) ?? payrollEmployees[0]
  const [showPayModal, setShowPayModal] = useState(false)

  const totalEarnings = 9250
  const totalDeductions = 1845
  const netAdj = 125
  const netPayable = 7530

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button type="button" className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-highest" onClick={() => navigate({ to: '/payroll/monthly' })}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-headline-lg font-semibold text-on-surface m-0">Payroll Review</h1>
            <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm flex items-center gap-1 ml-2">
              <span className="material-symbols-outlined text-[16px]">pending_actions</span> CALCULATED
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm text-on-surface-variant ml-12">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">person</span><span className="font-medium text-on-surface">{emp.name}</span></span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">badge</span>{emp.code}</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">work</span>{emp.department}</span>
          </div>
        </div>
        <div className="flex gap-2 ml-12 md:ml-0">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">print</span>}>Print</Button>
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>Export</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Salary" value={formatMoney(8500)} hint="Base package" icon="payments" iconBg="bg-surface-container text-secondary" />
        <MetricCard title="Total Earnings" value={formatMoney(totalEarnings)} hint="Includes allowances" icon="trending_up" iconBg="bg-[#dcfce7] text-[#166534]" />
        <MetricCard title="Total Deductions" value={`-${formatMoney(totalDeductions)}`} hint="Taxes & benefits" icon="trending_down" iconBg="bg-error-container text-on-error-container" />
        <div className="bg-deep-navy border border-deep-navy rounded-lg p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between mb-4 relative z-10">
            <h3 className="text-body-sm text-inverse-primary">Net Payable</h3>
            <div className="p-2 bg-white/10 rounded-lg text-white"><span className="material-symbols-outlined">account_balance</span></div>
          </div>
          <div className="relative z-10">
            <div className="text-headline-lg font-semibold text-white">{formatMoney(netPayable)}</div>
            <div className="text-body-sm text-inverse-primary mt-1">Final transfer amount</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright">
              <h2 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">receipt_long</span> Salary Breakdown
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-outline-variant">
              <div className="p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Earnings</h3>
                <ul className="space-y-4">
                  {[['Basic Salary', 5000], ['HRA', 2000], ['Conveyance', 800], ['Special Allowance', 700], ['Overtime', 750]].map(([n, a]) => (
                    <li key={String(n)} className="flex justify-between items-center text-body-md">
                      <span className="text-on-surface">{n}</span>
                      <span className="font-medium text-on-surface">{formatMoney(Number(a))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between">
                  <span className="text-label-md text-on-surface-variant">Gross Earnings</span>
                  <span className="text-title-lg font-semibold">{formatMoney(totalEarnings)}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-4">Deductions</h3>
                <ul className="space-y-4">
                  {[['PF', 450], ['TDS', 1350], ['Professional Tax', 45]].map(([n, a]) => (
                    <li key={String(n)} className="flex justify-between items-center text-body-md">
                      <span className="text-on-surface">{n}</span>
                      <span className="font-medium">{formatMoney(Number(a))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between">
                  <span className="text-label-md text-on-surface-variant">Total Deductions</span>
                  <span className="text-title-lg font-semibold">-{formatMoney(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-grow">
              <h3 className="text-title-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">calculate</span> Final Calculation
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-body-md"><span className="text-on-surface-variant">Gross Earnings</span><span className="font-medium">{formatMoney(totalEarnings)}</span></div>
                <div className="flex justify-between text-body-md"><span className="text-on-surface-variant">Total Deductions</span><span className="font-medium">-{formatMoney(totalDeductions)}</span></div>
                <div className="flex justify-between text-body-md"><span className="text-on-surface-variant">Net Adjustments</span><span className="font-medium">+{formatMoney(netAdj)}</span></div>
              </div>
              <div className="bg-surface-container p-4 rounded-lg border border-secondary-fixed">
                <div className="text-body-sm text-on-surface-variant mb-1 font-medium">Net Payable</div>
                <div className="text-display-lg font-bold text-on-surface tracking-tight">{formatMoney(netPayable)}</div>
              </div>
            </div>
            <div className="p-6 bg-surface-bright border-t border-outline-variant flex flex-col gap-3">
              <button type="button" className="w-full bg-deep-navy text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">check_circle</span> Approve Payroll
              </button>
              <button type="button" className="w-full border border-primary text-primary font-medium py-3 px-4 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2" onClick={() => setShowPayModal(true)}>
                <span className="material-symbols-outlined text-[20px]">payments</span> Record Payment
              </button>
            </div>
          </section>
        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={() => setShowPayModal(false)} />
          <div className="relative bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-lg border border-outline-variant z-10 p-6">
            <h2 className="text-title-lg font-semibold mb-4">Record Payroll Payment</h2>
            <p className="text-body-md text-on-surface-variant mb-6">Mark payment for {emp.name} — {formatMoney(netPayable)}</p>
            <div className="flex justify-end gap-3">
              <button type="button" className="px-5 py-2.5 rounded border border-outline-variant" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button
                type="button"
                className="px-5 py-2.5 rounded bg-electric-blue text-on-primary"
                onClick={() => {
                  setShowPayModal(false)
                  navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: emp.id } })
                }}
              >
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value, hint, icon, iconBg }: { title: string; value: string; hint: React.ReactNode; icon: string; iconBg: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-body-sm text-on-surface-variant">{title}</h3>
        <div className={cn('p-2 rounded-lg', iconBg)}><span className="material-symbols-outlined">{icon}</span></div>
      </div>
      <div>
        <div className="text-headline-md font-semibold text-on-surface">{value}</div>
        <div className="text-body-sm text-on-surface-variant mt-1">{hint}</div>
      </div>
    </div>
  )
}
