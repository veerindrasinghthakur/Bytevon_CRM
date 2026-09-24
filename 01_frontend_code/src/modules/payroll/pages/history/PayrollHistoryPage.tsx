import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { formatMoney } from '@/shared/mock/data/payroll'
import { usePayrollHistory, useHistoryEmployee } from '../../hooks/history/use-payroll-history'
import { payrollHistoryStatusStyles } from '../../schemas/enums'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

export function PayrollHistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const historyQuery = usePayrollHistory(search)

  const records = historyQuery.records

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
        <p className="text-caption text-on-surface-variant">
          {historyQuery.isLoading ? 'Loading…' : `${records.length} paid records`}
        </p>
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
              {records.map((r) => (
                <HistoryRow key={r.id} record={r} navigate={navigate} />
              ))}
              {!historyQuery.isLoading && records.length === 0 && (
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

function HistoryRow({
  record,
  navigate,
}: {
  record: {
    id: string
    payrollId?: string
    period: string
    employeeId: string
    paidOn: string
    gross: number
    net: number
    ref: string
  }
  navigate: ReturnType<typeof useNavigate>
}) {
  const empQuery = useHistoryEmployee(record.employeeId)
  const emp = empQuery.data

  return (
    <tr className="zebra-row h-[64px]">
      <td className="p-4 pl-6 text-body-md font-medium text-on-background">{record.period}</td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-label-sm">
            {emp?.initials ?? '?'}
          </div>
          <span className="text-body-md font-semibold text-on-background">{emp?.name ?? '—'}</span>
        </div>
      </td>
      <td className="p-4 text-caption text-on-surface-variant">{emp?.code ?? '—'}</td>
      <td className="p-4 text-right text-on-background">{formatMoney(record.gross)}</td>
      <td className="p-4 text-right font-semibold text-on-background">{formatMoney(record.net)}</td>
      <td className="p-4 text-on-surface-variant">{record.paidOn}</td>
      <td className="p-4 text-caption font-mono text-on-surface-variant">{record.ref}</td>
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
                params: { payrollId: record.payrollId ?? record.id },
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
                params: { employeeId: record.employeeId },
              })
            }
          >
            Employee history
          </button>
        </div>
      </td>
    </tr>
  )
}
