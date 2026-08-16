import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const historyRows = [
<<<<<<< HEAD
  { month: 'November 2023', gross: '$8,500.00', earnings: '+$500.00', deductions: '-$1,250.00', adjustments: '$0.00', net: '$7,750.00', paymentDate: 'Pending', status: 'APPROVED' as const },
  { month: 'October 2023', gross: '$8,500.00', earnings: '+$500.00', deductions: '-$1,250.00', adjustments: '$0.00', net: '$7,750.00', paymentDate: 'Oct 30, 2023', status: 'PAID' as const },
  { month: 'September 2023', gross: '$8,500.00', earnings: '+$200.00', deductions: '-$1,250.00', adjustments: '-$100.00', net: '$7,350.00', paymentDate: 'Sep 28, 2023', status: 'PAID' as const },
=======
  {
    month: 'November 2023',
    gross: '$8,500.00',
    earnings: '+$500.00',
    deductions: '-$1,250.00',
    adjustments: '$0.00',
    net: '$7,750.00',
    paymentDate: 'Pending',
    status: 'APPROVED' as const,
  },
  {
    month: 'October 2023',
    gross: '$8,500.00',
    earnings: '+$500.00',
    deductions: '-$1,250.00',
    adjustments: '$0.00',
    net: '$7,750.00',
    paymentDate: 'Oct 30, 2023',
    status: 'PAID' as const,
  },
  {
    month: 'September 2023',
    gross: '$8,500.00',
    earnings: '+$200.00',
    deductions: '-$1,250.00',
    adjustments: '-$100.00',
    net: '$7,350.00',
    paymentDate: 'Sep 28, 2023',
    status: 'PAID' as const,
  },
  {
    month: 'August 2023',
    gross: '$8,500.00',
    earnings: '+$500.00',
    deductions: '-$1,250.00',
    adjustments: '$0.00',
    net: '$7,750.00',
    paymentDate: 'Aug 30, 2023',
    status: 'PAID' as const,
  },
>>>>>>> origin/payroll
]

const statusStyle: Record<string, string> = {
  APPROVED: 'bg-[#e8f0fe] text-[#1967d2] border border-[#d2e3fc]',
  PAID: 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]',
}

export function EmployeePayrollHistoryPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const emp = payrollEmployees.find((e) => e.id === employeeId) ?? payrollEmployees[0]

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
<<<<<<< HEAD
          <h1 className="text-headline-lg font-semibold text-deep-navy">Payroll History</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Historical payroll records for the employee.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-sm">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary border border-outline-variant">{emp.initials}</div>
          <div>
            <h2 className="text-title-lg font-semibold text-on-surface">{emp.name}</h2>
            <div className="flex items-center gap-3 text-on-surface-variant text-body-sm mt-1">
              <span>{emp.code}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span>{emp.department}</span>
=======
          <div className="flex items-center gap-2 text-on-surface-variant text-label-md mb-2">
            <span>Employees</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span>{emp.name}</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface">Payroll History</span>
          </div>
          <h1 className="text-headline-lg font-semibold text-deep-navy">Payroll History</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage and view historical payroll records for the employee.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-sm">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary border border-outline-variant">
            {emp.initials}
          </div>
          <div>
            <h2 className="text-title-lg font-semibold text-on-surface">{emp.name}</h2>
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
>>>>>>> origin/payroll
            </div>
          </div>
        </div>
      </header>

<<<<<<< HEAD
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
          <span className="text-label-md text-on-surface-variant">All periods</span>
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>Export</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-label-sm text-on-surface-variant uppercase">
                <th className="p-4 font-medium">Month</th>
                <th className="p-4 font-medium">Gross</th>
                <th className="p-4 font-medium">Net</th>
                <th className="p-4 font-medium">Payment Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Action</th>
=======
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2">
          <span className="text-label-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">payments</span> Current Gross Salary
          </span>
          <div className="text-headline-lg font-semibold text-on-surface mt-1">$8,500.00</div>
          <div className="text-body-sm text-on-surface-variant mt-auto">Per pay period</div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2">
          <span className="text-label-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">account_balance_wallet</span> Current Net Salary
          </span>
          <div className="text-headline-lg font-semibold text-on-surface mt-1">$6,450.00</div>
          <div className="text-body-sm text-on-surface-variant mt-auto">Estimated average</div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-5">
            <span className="material-symbols-outlined text-[120px]">trending_up</span>
          </div>
          <div className="flex justify-between items-start relative z-10">
            <span className="text-label-md text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">insights</span> Total Paid This Year (YTD)
            </span>
            <span className="bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded text-label-sm">+12%</span>
          </div>
          <div className="text-headline-lg font-semibold text-on-surface mt-1 relative z-10">$64,500.00</div>
          <div className="text-body-sm text-on-surface-variant mt-auto relative z-10">As of Nov 2023</div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface">
          <div className="flex items-center gap-3">
            <select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-label-md focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none">
              <option>2023</option>
              <option>2022</option>
            </select>
            <select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-label-md focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none">
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
>>>>>>> origin/payroll
              </tr>
            </thead>
            <tbody className="text-body-sm divide-y divide-outline-variant">
              {historyRows.map((r) => (
                <tr key={r.month} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 text-on-surface font-medium">{r.month}</td>
                  <td className="p-4 text-on-surface-variant">{r.gross}</td>
<<<<<<< HEAD
                  <td className="p-4 text-on-surface font-semibold">{r.net}</td>
                  <td className="p-4 text-on-surface-variant">{r.paymentDate}</td>
                  <td className="p-4">
                    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium', statusStyle[r.status])}>{r.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      className="text-electric-blue hover:text-secondary text-label-md"
                      onClick={() => navigate({ to: '/payroll/review/$employeeId', params: { employeeId: emp.id } })}
                    >
                      View
                    </button>
=======
                  <td className="p-4 text-[#137333] font-medium">{r.earnings}</td>
                  <td className="p-4 text-[#c5221f]">{r.deductions}</td>
                  <td className={cn('p-4', r.adjustments.startsWith('-') ? 'text-error font-medium' : 'text-on-surface-variant')}>
                    {r.adjustments}
                  </td>
                  <td className="p-4 text-on-surface font-semibold">{r.net}</td>
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
                          className="text-on-surface-variant hover:text-on-surface text-label-md flex items-center gap-1"
                          title="View Payslip"
                          onClick={() =>
                            navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: emp.id } })
                          }
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                        <button
                          type="button"
                          className="text-electric-blue hover:text-secondary text-label-md flex items-center gap-1"
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
                        className="text-electric-blue hover:text-secondary text-label-md flex items-center justify-end gap-1 ml-auto"
                        onClick={() =>
                          navigate({ to: '/payroll/review/$employeeId', params: { employeeId: emp.id } })
                        }
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span> View Payroll
                      </button>
                    )}
>>>>>>> origin/payroll
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<<<<<<< HEAD
=======

        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest rounded-b-xl">
          <div className="text-body-sm text-on-surface-variant">
            Showing <span className="font-medium text-on-surface">1</span> to{' '}
            <span className="font-medium text-on-surface">10</span> of{' '}
            <span className="font-medium text-on-surface">24</span> results
          </div>
          <div className="flex gap-1">
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded bg-electric-blue text-on-primary text-label-sm">
              1
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface hover:bg-surface-container text-label-sm">
              2
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
>>>>>>> origin/payroll
      </section>
    </div>
  )
}
