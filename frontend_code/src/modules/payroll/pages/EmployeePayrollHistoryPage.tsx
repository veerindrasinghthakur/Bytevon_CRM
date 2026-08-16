import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const historyRows = [
  { month: 'November 2023', gross: '$8,500.00', earnings: '+$500.00', deductions: '-$1,250.00', adjustments: '$0.00', net: '$7,750.00', paymentDate: 'Pending', status: 'APPROVED' as const },
  { month: 'October 2023', gross: '$8,500.00', earnings: '+$500.00', deductions: '-$1,250.00', adjustments: '$0.00', net: '$7,750.00', paymentDate: 'Oct 30, 2023', status: 'PAID' as const },
  { month: 'September 2023', gross: '$8,500.00', earnings: '+$200.00', deductions: '-$1,250.00', adjustments: '-$100.00', net: '$7,350.00', paymentDate: 'Sep 28, 2023', status: 'PAID' as const },
]

const statusStyle: Record<string, string> = {
  APPROVED: 'bg-primary-fixed text-primary border border-outline-variant',
  PAID: 'bg-success-emerald/10 text-success-emerald border border-success-emerald/20',
}

export function EmployeePayrollHistoryPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const emp = payrollEmployees.find((e) => e.id === employeeId) ?? payrollEmployees[0]

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-label-md mb-2">
            <span>Employees</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span>{emp.name}</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-deep-navy font-medium">Payroll History</span>
          </div>
          <h1 className="text-headline-lg font-semibold text-deep-navy">Payroll History</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage and view historical payroll records for the employee.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary border border-outline-variant">
            {emp.initials}
          </div>
          <div>
            <h2 className="text-title-lg font-semibold text-deep-navy">{emp.name}</h2>
            <div className="flex items-center gap-3 text-on-surface-variant text-body-sm mt-1">
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
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2 card-hover">
          <span className="text-label-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">payments</span> Current Gross Salary
          </span>
          <div className="text-headline-lg font-semibold text-deep-navy mt-1">$8,500.00</div>
          <div className="text-body-sm text-on-surface-variant mt-auto">Per pay period</div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2 card-hover">
          <span className="text-label-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">account_balance_wallet</span> Current Net Salary
          </span>
          <div className="text-headline-lg font-semibold text-deep-navy mt-1">$6,450.00</div>
          <div className="text-body-sm text-on-surface-variant mt-auto">Estimated average</div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2 relative overflow-hidden card-hover">
          <div className="absolute right-0 bottom-0 opacity-5">
            <span className="material-symbols-outlined text-[120px]">trending_up</span>
          </div>
          <div className="flex justify-between items-start relative z-10">
            <span className="text-label-md text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">insights</span> Total Paid This Year (YTD)
            </span>
            <span className="bg-success-emerald/10 text-success-emerald px-2 py-1 rounded text-label-sm">+12%</span>
          </div>
          <div className="text-headline-lg font-semibold text-deep-navy mt-1 relative z-10">$64,500.00</div>
          <div className="text-body-sm text-on-surface-variant mt-auto relative z-10">As of Nov 2023</div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-label-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              <option>2023</option>
              <option>2022</option>
            </select>
            <select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-label-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
              <option>Status: All</option>
              <option>Calculated</option>
              <option>Approved</option>
              <option>Paid</option>
            </select>
          </div>
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>
            Export
          </Button>
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
              {historyRows.map((r) => (
                <tr key={r.month} className="bv-row-hover">
                  <td className="p-4 text-deep-navy font-medium">{r.month}</td>
                  <td className="p-4 text-on-surface-variant">{r.gross}</td>
                  <td className="p-4 text-success-emerald font-medium">{r.earnings}</td>
                  <td className="p-4 text-error">{r.deductions}</td>
                  <td className={cn('p-4', r.adjustments.startsWith('-') ? 'text-error font-medium' : 'text-on-surface-variant')}>
                    {r.adjustments}
                  </td>
                  <td className="p-4 text-deep-navy font-semibold">{r.net}</td>
                  <td className="p-4 text-on-surface-variant">{r.paymentDate}</td>
                  <td className="p-4">
                    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium', statusStyle[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {r.status === 'PAID' ? (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-1 transition-colors"
                          title="View Payslip"
                          onClick={() =>
                            navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: emp.id } })
                          }
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                        <button
                          type="button"
                          className="text-primary hover:text-secondary text-label-md flex items-center gap-1 transition-colors"
                          onClick={() =>
                            navigate({ to: '/payroll/review/$employeeId', params: { employeeId: emp.id } })
                          }
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="text-primary hover:text-secondary text-label-md flex items-center justify-end gap-1 ml-auto transition-colors"
                        onClick={() =>
                          navigate({ to: '/payroll/review/$employeeId', params: { employeeId: emp.id } })
                        }
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span> View Payroll
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest rounded-b-xl">
          <div className="text-body-sm text-on-surface-variant">
            Showing <span className="font-medium text-deep-navy">1</span> to{' '}
            <span className="font-medium text-deep-navy">10</span> of{' '}
            <span className="font-medium text-deep-navy">24</span> results
          </div>
          <div className="flex gap-1">
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary text-label-sm">
              1
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-deep-navy hover:bg-surface-container text-label-sm">
              2
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
