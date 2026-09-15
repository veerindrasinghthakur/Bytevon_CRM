import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { Select } from '@/shared/components/ui/Select'
import { ResourceName } from '@/shared/schema'
import { useEmployeePayrollHistory } from '../../hooks/history/use-employee-payroll-history'
import { payrollHistoryStatusStyles } from '../../schemas/enums'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

export function EmployeePayrollHistoryPage() {
  const navigate = useNavigate()
  const { emp, historyRows, summaryCards, totalResults, formatMoney, isLoading } =
    useEmployeePayrollHistory()
  const [yearFilter, setYearFilter] = useState('2026')
  const [statusFilter, setStatusFilter] = useState('All')

  if (isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading history…</div>
  }
  if (!emp) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">Employee not found.</p>
        <BackButton to={payrollRoutes.salary} />
      </div>
    )
  }

  const filtered = historyRows.filter((r) => {
    if (yearFilter !== 'All' && String(r.year) !== yearFilter) return false
    if (statusFilter !== 'All' && r.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-on-surface-variant text-label-md flex-wrap">
          <button type="button" className="hover:text-secondary transition-colors" onClick={() => safeNavigate(navigate, { to: payrollRoutes.root })}>
            Payroll
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button type="button" className="hover:text-secondary transition-colors" onClick={() => safeNavigate(navigate, { to: payrollRoutes.salary })}>
            Salary Management
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button
            type="button"
            className="hover:text-secondary transition-colors"
            onClick={() =>
              safeNavigate(navigate, {
                to: payrollRoutes.salaryDetailPath,
                params: { employeeId: emp.id },
              })
            }
          >
            {emp.name}
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-background font-medium">Payroll History</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <BackButton to={payrollRoutes.salaryDetail(emp.id)} label="" className="!px-1 mt-1" />
            <div>
              <h1 className="text-headline-lg font-semibold text-on-background">Payroll History</h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                Manage and view historical payroll records for the employee.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bv-surface p-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary border border-outline-variant">
              {emp.initials}
            </div>
            <div>
              <h2 className="text-title-lg font-semibold text-on-background">{emp.name}</h2>
              <div className="flex items-center gap-3 text-on-surface-variant text-body-sm mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">badge</span> {emp.code}
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">engineering</span> {emp.department}
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span>{emp.role}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card) => (
          <div key={card.id} className="bv-surface p-6 flex flex-col gap-2 relative overflow-hidden">
            {card.id === 'ytd' && (
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[120px]">trending_up</span>
              </div>
            )}
            <div className="flex justify-between items-start relative z-10">
              <span className="text-label-md text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-outline">{card.icon}</span> {card.label}
              </span>
            </div>
            <div className="text-headline-lg font-semibold text-on-background mt-1 relative z-10">{card.value}</div>
            <div className="text-body-sm text-on-surface-variant mt-auto relative z-10">{card.subtitle}</div>
          </div>
        ))}
      </section>

      <section className="bv-surface flex flex-col">
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface">
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={yearFilter}
              onChange={setYearFilter}
              minWidthClass="min-w-[120px]"
              options={[
                { value: 'All', label: 'All years' },
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              minWidthClass="min-w-[140px]"
              options={[
                { value: 'All', label: 'Status: All' },
                { value: 'PAID', label: 'Paid' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'CALCULATED', label: 'Calculated' },
              ]}
            />
          </div>
          <ExportButton
            resource={ResourceName.PAYROLL}
            filenameStem={`payroll-history-${emp.code}`}
            filters={{ employeeId: emp.id, year: yearFilter, status: statusFilter }}
            label="Export"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="p-4 font-medium whitespace-nowrap">Month</th>
                <th className="p-4 font-medium whitespace-nowrap">Gross Salary</th>
                <th className="p-4 font-medium whitespace-nowrap">Total Earnings</th>
                <th className="p-4 font-medium whitespace-nowrap">Total Deductions</th>
                <th className="p-4 font-medium whitespace-nowrap">Adjustments</th>
                <th className="p-4 font-medium whitespace-nowrap">Net Salary</th>
                <th className="p-4 font-medium whitespace-nowrap">Payment Date</th>
                <th className="p-4 font-medium whitespace-nowrap">Status</th>
                <th className="p-4 font-medium whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-body-sm divide-y divide-outline-variant">
              {filtered.map((r) => (
                <tr key={r.id} className="zebra-row group">
                  <td className="p-4 text-on-background font-medium">{r.month}</td>
                  <td className="p-4 text-on-surface-variant">{formatMoney(r.gross)}</td>
                  <td className="p-4 text-secondary font-medium">{formatMoney(r.earnings)}</td>
                  <td className="p-4 text-error">{formatMoney(r.deductions)}</td>
                  <td className={cn('p-4', r.adjustments < 0 ? 'text-error font-medium' : 'text-on-surface-variant')}>
                    {r.adjustments >= 0 ? '+' : ''}
                    {formatMoney(r.adjustments)}
                  </td>
                  <td className="p-4 text-on-background font-semibold">{formatMoney(r.net)}</td>
                  <td className="p-4 text-on-surface-variant">{r.paymentDate ?? '—'}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
                        payrollHistoryStatusStyles[r.status] ?? 'status-badge status-neutral',
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      {r.status === 'PAID' && (
                        <button
                          type="button"
                          className="text-on-surface-variant hover:text-on-surface text-label-md inline-flex items-center gap-1 transition-colors"
                          title="View Payslip"
                          onClick={() =>
                            safeNavigate(navigate, {
                              to: payrollRoutes.payslipPath,
                              params: { employeeId: emp.id },
                            })
                          }
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-primary hover:text-secondary text-label-md inline-flex items-center gap-1 transition-colors"
                        onClick={() =>
                          safeNavigate(navigate, {
                            to: payrollRoutes.payslipPath,
                            params: { employeeId: emp.id },
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        {r.status === 'APPROVED' ? 'View Payroll' : ''}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest rounded-b-xl">
          <div className="text-body-sm text-on-surface-variant">
            Showing <span className="font-medium text-on-surface">{filtered.length}</span> of{' '}
            <span className="font-medium text-on-surface">{totalResults}</span> results
          </div>
        </div>
      </section>
    </div>
  )
}
