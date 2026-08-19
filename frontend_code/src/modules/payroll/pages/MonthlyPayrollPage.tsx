import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { payrollEmployees, monthlySummary, formatMoney } from '../data/mock'
import { cn } from '@/shared/lib/cn'

/** Demo view modes matching Stitch monthly payroll variants */
type RunView = 'ready' | 'empty' | 'error' | 'locked'

const statusBadge: Record<string, string> = {
  Calculated: 'bg-secondary-container text-on-secondary-container',
  Approved: 'bg-primary-fixed text-primary',
  Paid: 'bg-success-emerald/10 text-success-emerald',
}

export function MonthlyPayrollPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<RunView>('ready')
  const [detailsOpen, setDetailsOpen] = useState(false)

  const rows = useMemo(
    () =>
      payrollEmployees.filter(
        (r) =>
          !search ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  const allPaid = rows.length > 0 && rows.every((r) => r.status === 'Paid')
  const effectiveView: RunView =
    view === 'ready' && allPaid ? 'locked' : view

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Monthly Payroll"
        description="Review employee payroll calculations, approvals and payments."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-label-sm text-on-surface-variant">Demo state</label>
            <select
              className="bg-surface-container-lowest border border-outline-variant rounded text-body-sm px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              value={view}
              onChange={(e) => setView(e.target.value as RunView)}
            >
              <option value="ready">Ready</option>
              <option value="empty">Empty</option>
              <option value="error">Error</option>
              <option value="locked">Paid / locked</option>
            </select>
          </div>
        }
      />

      {effectiveView === 'empty' && (
        <EmptyState
          icon="payments"
          title="No payroll run for this period"
          description="Generate monthly payroll to calculate gross, earnings, deductions, and net pay for active employees."
          actionLabel="Run payroll"
          onAction={() => navigate({ to: '/payroll/run' })}
        >
          <Button variant="outline" className="mt-3" onClick={() => navigate({ to: '/payroll' })}>
            Back to overview
          </Button>
        </EmptyState>
      )}

      {effectiveView === 'error' && (
        <div className="max-w-lg mx-auto">
          <ErrorState
            title="Payroll generation failed"
            description="An unexpected error occurred while calculating tax deductions. Retry generation or return to the dashboard."
            onRetry={() => setView('ready')}
            onBack={() => navigate({ to: '/payroll' })}
          />
          <div className="mt-4 border-t border-outline-variant pt-4">
            <button
              type="button"
              className="flex items-center justify-between w-full text-on-surface-variant hover:text-on-surface text-label-md"
              onClick={() => setDetailsOpen((o) => !o)}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">code</span>
                Technical details
              </span>
              <span className="material-symbols-outlined text-[20px]">
                {detailsOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {detailsOpen && (
              <pre className="mt-3 rounded-lg bg-on-background text-surface-container-lowest p-4 text-xs font-mono overflow-x-auto">
                {`Error: ERR_TAX_DEDUCTION_FAILED\nContext: Department ENG_001\nTimestamp: 2026-08-18T14:32:01.000Z`}
              </pre>
            )}
          </div>
        </div>
      )}

      {(effectiveView === 'ready' || effectiveView === 'locked') && (
        <>
          {effectiveView === 'locked' && (
            <div
              className="flex items-start gap-3 rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-body-sm"
              role="status"
            >
              <span className="material-symbols-outlined text-secondary shrink-0">lock</span>
              <div>
                <p className="font-semibold text-on-background">This payroll run is paid and locked</p>
                <p className="text-on-surface-variant">
                  Approvals and payments are closed. You can still view payslips and export the report.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <select className="bg-surface-container-lowest border border-outline-variant rounded text-body-md px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors">
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
              <select className="bg-surface-container-lowest border border-outline-variant rounded text-body-md px-3 py-2 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors">
                <option>2022</option>
                <option>2023</option>
              </select>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded text-body-md pl-9 pr-3 py-2 w-64 focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                  placeholder="Search employee..."
                  type="text"
                />
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
            >
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <SummaryCard label="Total Employees" value={String(monthlySummary.totalEmployees)} />
            <SummaryCard label="Gross Salary" value={`$${monthlySummary.grossSalary}`} />
            <SummaryCard
              label="Earnings"
              value={formatMoney(monthlySummary.earnings)}
              valueClass="text-success-emerald"
            />
            <SummaryCard
              label="Deductions"
              value={formatMoney(monthlySummary.deductions)}
              valueClass="text-error"
            />
            <SummaryCard
              label="Net Payroll"
              value={`$${monthlySummary.netPayroll}`}
              valueClass="text-primary font-bold"
              highlight
            />
            <SummaryCard
              label="Pending Approval"
              value={String(monthlySummary.pendingApproval)}
              valueClass="text-warning-amber"
            />
            <SummaryCard
              label="Pending Payment"
              value={String(monthlySummary.pendingPayment)}
              valueClass="text-primary"
            />
          </div>

          <div className="bv-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-4 text-label-bold text-on-surface-variant">Employee</th>
                    <th className="p-4 text-label-bold text-on-surface-variant">Code</th>
                    <th className="p-4 text-label-bold text-on-surface-variant">Department</th>
                    <th className="p-4 text-label-bold text-on-surface-variant text-right">Gross Salary</th>
                    <th className="p-4 text-label-bold text-on-surface-variant text-right">Earnings</th>
                    <th className="p-4 text-label-bold text-on-surface-variant text-right">Deductions</th>
                    <th className="p-4 text-label-bold text-on-surface-variant text-right">Net Salary</th>
                    <th className="p-4 text-label-bold text-on-surface-variant">Status</th>
                    <th className="p-4 text-label-bold text-on-surface-variant">Payment Ref</th>
                    <th className="p-4 text-label-bold text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-body-md">
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-outline-variant zebra-row h-[72px]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold border border-outline-variant">
                            {r.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-deep-navy">{r.name}</p>
                            <p className="text-caption text-on-surface-variant">{r.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant">{r.code}</td>
                      <td className="p-4 text-on-surface-variant">{r.department}</td>
                      <td className="p-4 text-right text-deep-navy">{formatMoney(r.gross)}</td>
                      <td className="p-4 text-right text-success-emerald">+{formatMoney(r.earnings)}</td>
                      <td className="p-4 text-right text-error">-{formatMoney(r.deductions)}</td>
                      <td className="p-4 text-right font-bold text-deep-navy">{formatMoney(r.net)}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-label-sm font-medium',
                            statusBadge[r.status],
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant text-caption">{r.paymentRef ?? '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {effectiveView === 'locked' || r.status === 'Paid' ? (
                            <>
                              <button
                                type="button"
                                className="text-on-surface-variant hover:text-secondary text-sm font-medium transition-colors"
                                onClick={() =>
                                  navigate({
                                    to: '/payroll/payslip/$employeeId',
                                    params: { employeeId: r.id },
                                  })
                                }
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="text-on-surface-variant hover:text-secondary transition-colors"
                                title="Payslip"
                                onClick={() =>
                                  navigate({
                                    to: '/payroll/payslip/$employeeId',
                                    params: { employeeId: r.id },
                                  })
                                }
                              >
                                <span className="material-symbols-outlined text-xl">receipt_long</span>
                              </button>
                            </>
                          ) : r.status === 'Calculated' ? (
                            <>
                              <button
                                type="button"
                                className="text-on-surface-variant hover:text-secondary text-sm font-medium transition-colors"
                                onClick={() =>
                                  navigate({
                                    to: '/payroll/review/$employeeId',
                                    params: { employeeId: r.id },
                                  })
                                }
                              >
                                Review
                              </button>
                              <button
                                type="button"
                                className="bg-deep-navy text-on-primary px-3 py-1.5 rounded text-label-sm hover:opacity-90 transition-all"
                                onClick={() =>
                                  navigate({
                                    to: '/payroll/review/$employeeId',
                                    params: { employeeId: r.id },
                                  })
                                }
                              >
                                Approve
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="text-on-surface-variant hover:text-secondary text-sm font-medium transition-colors"
                                onClick={() =>
                                  navigate({
                                    to: '/payroll/review/$employeeId',
                                    params: { employeeId: r.id },
                                  })
                                }
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="border border-primary text-primary px-3 py-1.5 rounded text-label-sm hover:bg-surface-container-low transition-colors"
                                onClick={() =>
                                  navigate({
                                    to: '/payroll/review/$employeeId',
                                    params: { employeeId: r.id },
                                  })
                                }
                              >
                                Pay
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  valueClass,
  highlight,
}: {
  label: string
  value: string
  valueClass?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'bv-surface card-hover p-5 flex flex-col justify-center h-[120px]',
        highlight && 'ring-1 ring-primary',
      )}
    >
      <p
        className={cn(
          'text-caption text-on-surface-variant uppercase tracking-wider mb-1',
          highlight && 'text-primary font-semibold',
        )}
      >
        {label}
      </p>
      <p className={cn('text-headline-lg font-semibold text-deep-navy', valueClass)}>{value}</p>
    </div>
  )
}
