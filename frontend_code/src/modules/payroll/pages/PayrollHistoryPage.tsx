import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees, formatMoney } from '@/shared/mock/data/payroll'
import { payrollHistoryStatusStyles } from '../schemas/enums'
import { payrollRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

/** Org-wide paid salary / payroll run history (read-only). */
const paidRecords = [
  {
    id: 'ph1',
    period: 'October 2023',
    employeeId: 'e3',
    paidOn: 'Oct 30, 2023',
    gross: 5800,
    net: 5700,
    ref: 'TRX-998230',
  },
  {
    id: 'ph2',
    period: 'October 2023',
    employeeId: 'e5',
    paidOn: 'Oct 30, 2023',
    gross: 7500,
    net: 6400,
    ref: 'TRX-998232',
  },
  {
    id: 'ph3',
    period: 'September 2023',
    employeeId: 'e1',
    paidOn: 'Sep 28, 2023',
    gross: 8500,
    net: 7750,
    ref: 'TRX-997110',
  },
  {
    id: 'ph4',
    period: 'September 2023',
    employeeId: 'e3',
    paidOn: 'Sep 28, 2023',
    gross: 5800,
    net: 5600,
    ref: 'TRX-997112',
  },
  {
    id: 'ph5',
    period: 'August 2023',
    employeeId: 'e5',
    paidOn: 'Aug 31, 2023',
    gross: 7500,
    net: 6400,
    ref: 'TRX-996001',
  },
]

export function PayrollHistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const rows = paidRecords
    .map((r) => {
      const emp = payrollEmployees.find((e) => e.id === r.employeeId)
      return { ...r, emp }
    })
    .filter((r) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.period.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q) ||
        r.emp?.name.toLowerCase().includes(q) ||
        r.emp?.code.toLowerCase().includes(q)
      )
    })

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Payroll History"
        description="Past paid salary records across the organization. Read-only."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
          >
            Export
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
            placeholder="Search period, employee, reference..."
            type="text"
          />
        </div>
        <p className="text-caption text-on-surface-variant">{rows.length} paid records</p>
      </div>

      <section className="bv-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="p-4 pl-6 font-medium">Period</th>
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 text-right font-medium">Gross</th>
                <th className="p-4 text-right font-medium">Net Paid</th>
                <th className="p-4 font-medium">Paid On</th>
                <th className="p-4 font-medium">Payment Ref</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 pr-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map((r) => (
                <tr key={r.id} className="zebra-row h-[64px]">
                  <td className="p-4 pl-6 text-body-md font-medium text-on-background">{r.period}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-label-sm">
                        {r.emp?.initials ?? '?'}
                      </div>
                      <span className="text-body-md font-semibold text-on-background">{r.emp?.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-caption text-on-surface-variant">{r.emp?.code ?? '—'}</td>
                  <td className="p-4 text-right text-on-background">{formatMoney(r.gross)}</td>
                  <td className="p-4 text-right font-semibold text-on-background">{formatMoney(r.net)}</td>
                  <td className="p-4 text-on-surface-variant">{r.paidOn}</td>
                  <td className="p-4 text-caption font-mono text-on-surface-variant">{r.ref}</td>
                  <td className="p-4 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                        payrollHistoryStatusStyles.PAID,
                      )}
                    >
                      PAID
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        className="text-primary hover:text-secondary text-label-md transition-colors"
                        onClick={() =>
                          safeNavigate(navigate, {
                            to: payrollRoutes.payslipPath,
                            params: { employeeId: r.employeeId },
                          })
                        }
                      >
                        Payslip
                      </button>
                      <button
                        type="button"
                        className="text-on-surface-variant hover:text-secondary text-label-md transition-colors"
                        onClick={() =>
                          safeNavigate(navigate, {
                            to: payrollRoutes.historyEmployeePath,
                            params: { employeeId: r.employeeId },
                          })
                        }
                      >
                        Employee history
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-on-surface-variant text-body-md">
                    No paid records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
