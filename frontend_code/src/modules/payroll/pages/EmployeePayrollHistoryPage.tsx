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
            </div>
          </div>
        </div>
      </header>

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
              </tr>
            </thead>
            <tbody className="text-body-sm divide-y divide-outline-variant">
              {historyRows.map((r) => (
                <tr key={r.month} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 text-on-surface font-medium">{r.month}</td>
                  <td className="p-4 text-on-surface-variant">{r.gross}</td>
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
