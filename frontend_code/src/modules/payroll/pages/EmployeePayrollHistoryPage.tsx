import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees } from '../data/mock'
import { cn } from '@/shared/lib/cn'

/** Immutable paid-out payroll history only — no mutable / in-progress rows. */
const historyRows = [
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
    gross: '$8,200.00',
    earnings: '+$0.00',
    deductions: '-$1,200.00',
    adjustments: '$0.00',
    net: '$7,000.00',
    paymentDate: 'Aug 31, 2023',
    status: 'PAID' as const,
  },
]

const statusStyle: Record<string, string> = {
  PAID: 'bg-success-emerald/10 text-success-emerald border border-success-emerald/20',
}

export function EmployeePayrollHistoryPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const emp = payrollEmployees.find((e) => e.id === employeeId) ?? payrollEmployees[0]

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-on-surface-variant text-label-md flex-wrap">
          <button type="button" className="hover:text-secondary transition-colors" onClick={() => navigate({ to: '/payroll' })}>
            Payroll
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button type="button" className="hover:text-secondary transition-colors" onClick={() => navigate({ to: '/payroll/salary' })}>
            Salary Management
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button
            type="button"
            className="hover:text-secondary transition-colors"
            onClick={() => navigate({ to: '/payroll/salary/$employeeId', params: { employeeId: emp.id } })}
          >
            {emp.name}
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-deep-navy font-medium">Payroll History</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="text-on-surface-variant hover:text-secondary p-1 rounded-full hover:bg-surface-container transition-colors mt-1"
              onClick={() => navigate({ to: '/payroll/salary/$employeeId', params: { employeeId: emp.id } })}
              aria-label="Back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-headline-lg font-semibold text-deep-navy">Payroll History</h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                Paid-out payroll records only. Entries are read-only.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary border border-outline-variant">
              {emp.initials}
            </div>
            <div>
              <h2 className="text-title-lg font-semibold text-deep-navy">{emp.name}</h2>
              <div className="flex items-center gap-3 text-on-surface-variant text-body-sm mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">badge</span> {emp.code}
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span>{emp.department}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span>{emp.role}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-label-md text-on-surface-variant">
            Showing paid payrolls only — no pending or in-progress entries.
          </p>
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
                  <td
                    className={cn(
                      'p-4',
                      r.adjustments.startsWith('-') ? 'text-error font-medium' : 'text-on-surface-variant'
                    )}
                  >
                    {r.adjustments}
                  </td>
                  <td className="p-4 text-deep-navy font-semibold">{r.net}</td>
                  <td className="p-4 text-on-surface-variant">{r.paymentDate}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
                        statusStyle[r.status]
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="text-primary hover:text-secondary text-label-md inline-flex items-center gap-1 transition-colors"
                      onClick={() =>
                        navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: emp.id } })
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
