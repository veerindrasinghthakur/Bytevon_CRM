import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees, monthlySummary, formatMoney } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const statusBadge: Record<string, string> = {
  Calculated: 'bg-secondary-container text-on-secondary-container',
  Approved: 'bg-[#e0f2fe] text-[#0369a1]',
  Paid: 'bg-[#dcfce7] text-[#15803d]',
}

export function MonthlyPayrollPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
<<<<<<< HEAD
=======

>>>>>>> origin/payroll
  const rows = payrollEmployees.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
<<<<<<< HEAD
      <PageHeader title="Monthly Payroll" description="Review employee payroll calculations, approvals and payments." />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
=======
      <PageHeader
        title="Monthly Payroll"
        description="Review employee payroll calculations, approvals and payments."
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <select className="bg-surface-container-lowest border border-outline-variant rounded text-body-md px-3 py-2 focus:ring-1 focus:ring-primary outline-none">
            <option>October</option>
            <option>November</option>
            <option selected>December</option>
          </select>
          <select className="bg-surface-container-lowest border border-outline-variant rounded text-body-md px-3 py-2 focus:ring-1 focus:ring-primary outline-none">
            <option>2022</option>
            <option selected>2023</option>
          </select>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
>>>>>>> origin/payroll
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded text-body-md pl-9 pr-3 py-2 w-64 focus:ring-1 focus:ring-primary outline-none"
              placeholder="Search employee..."
              type="text"
            />
          </div>
<<<<<<< HEAD
        </div>
        <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>
=======
          <select className="bg-surface-container-lowest border border-outline-variant rounded text-body-md px-3 py-2 focus:ring-1 focus:ring-primary outline-none">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>Marketing</option>
          </select>
          <select className="bg-surface-container-lowest border border-outline-variant rounded text-body-md px-3 py-2 focus:ring-1 focus:ring-primary outline-none">
            <option>All Statuses</option>
            <option>Calculated</option>
            <option>Approved</option>
            <option>Paid</option>
          </select>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
        >
>>>>>>> origin/payroll
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <SummaryCard label="Total Employees" value={String(monthlySummary.totalEmployees)} />
        <SummaryCard label="Gross Salary" value={`$${monthlySummary.grossSalary}`} />
        <SummaryCard label="Earnings" value={formatMoney(monthlySummary.earnings)} valueClass="text-success-emerald" />
        <SummaryCard label="Deductions" value={formatMoney(monthlySummary.deductions)} valueClass="text-error" />
<<<<<<< HEAD
        <SummaryCard label="Net Payroll" value={`$${monthlySummary.netPayroll}`} valueClass="text-primary font-bold" highlight />
=======
        <SummaryCard
          label="Net Payroll"
          value={`$${monthlySummary.netPayroll}`}
          valueClass="text-primary font-bold"
          highlight
        />
>>>>>>> origin/payroll
        <SummaryCard label="Pending Approval" value={String(monthlySummary.pendingApproval)} valueClass="text-warning-amber" />
        <SummaryCard label="Pending Payment" value={String(monthlySummary.pendingPayment)} valueClass="text-electric-blue" />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th className="p-4 text-label-bold text-on-surface-variant">Employee</th>
                <th className="p-4 text-label-bold text-on-surface-variant">Code</th>
                <th className="p-4 text-label-bold text-on-surface-variant">Department</th>
<<<<<<< HEAD
                <th className="p-4 text-label-bold text-on-surface-variant text-right">Gross</th>
                <th className="p-4 text-label-bold text-on-surface-variant text-right">Net</th>
                <th className="p-4 text-label-bold text-on-surface-variant">Status</th>
=======
                <th className="p-4 text-label-bold text-on-surface-variant text-right">Gross Salary</th>
                <th className="p-4 text-label-bold text-on-surface-variant text-right">Earnings</th>
                <th className="p-4 text-label-bold text-on-surface-variant text-right">Deductions</th>
                <th className="p-4 text-label-bold text-on-surface-variant text-right">Net Salary</th>
                <th className="p-4 text-label-bold text-on-surface-variant">Status</th>
                <th className="p-4 text-label-bold text-on-surface-variant">Payment Ref</th>
>>>>>>> origin/payroll
                <th className="p-4 text-label-bold text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-md">
<<<<<<< HEAD
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-outline-variant hover:bg-surface-bright transition-colors h-[72px]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold border border-outline-variant">{r.initials}</div>
=======
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-outline-variant hover:bg-surface-bright transition-colors h-[72px]',
                    i === 0 && 'bg-surface-container-low'
                  )}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold border border-outline-variant">
                        {r.initials}
                      </div>
>>>>>>> origin/payroll
                      <div>
                        <p className="font-semibold text-on-surface">{r.name}</p>
                        <p className="text-caption text-on-surface-variant">{r.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-on-surface-variant">{r.code}</td>
                  <td className="p-4 text-on-surface-variant">{r.department}</td>
                  <td className="p-4 text-right">{formatMoney(r.gross)}</td>
<<<<<<< HEAD
                  <td className="p-4 text-right font-bold text-on-surface">{formatMoney(r.net)}</td>
                  <td className="p-4">
                    <span className={cn('inline-flex items-center px-2 py-1 rounded text-label-sm', statusBadge[r.status])}>{r.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      className="text-on-surface-variant hover:text-primary text-sm font-medium"
                      onClick={() => navigate({ to: '/payroll/review/$employeeId', params: { employeeId: r.id } })}
                    >
                      Review
                    </button>
=======
                  <td className="p-4 text-right text-success-emerald">+{formatMoney(r.earnings)}</td>
                  <td className="p-4 text-right text-error">-{formatMoney(r.deductions)}</td>
                  <td className="p-4 text-right font-bold text-on-surface">{formatMoney(r.net)}</td>
                  <td className="p-4">
                    <span className={cn('inline-flex items-center px-2 py-1 rounded text-label-sm', statusBadge[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant text-caption">{r.paymentRef ?? '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === 'Calculated' && (
                        <>
                          <button
                            type="button"
                            className="text-on-surface-variant hover:text-primary text-sm font-medium"
                            onClick={() =>
                              navigate({ to: '/payroll/review/$employeeId', params: { employeeId: r.id } })
                            }
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="bg-primary text-on-primary px-3 py-1.5 rounded text-label-sm hover:bg-primary-container transition-colors"
                            onClick={() =>
                              navigate({ to: '/payroll/review/$employeeId', params: { employeeId: r.id } })
                            }
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {r.status === 'Approved' && (
                        <>
                          <button
                            type="button"
                            className="text-on-surface-variant hover:text-primary text-sm font-medium"
                            onClick={() =>
                              navigate({ to: '/payroll/review/$employeeId', params: { employeeId: r.id } })
                            }
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="border border-primary text-primary px-3 py-1.5 rounded text-label-sm hover:bg-surface-container-low transition-colors"
                            onClick={() =>
                              navigate({ to: '/payroll/review/$employeeId', params: { employeeId: r.id } })
                            }
                          >
                            Pay
                          </button>
                        </>
                      )}
                      {r.status === 'Paid' && (
                        <>
                          <button
                            type="button"
                            className="text-on-surface-variant hover:text-primary text-sm font-medium"
                            onClick={() =>
                              navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: r.id } })
                            }
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-on-surface-variant hover:text-primary"
                            title="Download Payslip"
                            onClick={() =>
                              navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: r.id } })
                            }
                          >
                            <span className="material-symbols-outlined text-xl">receipt_long</span>
                          </button>
                        </>
                      )}
                    </div>
>>>>>>> origin/payroll
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<<<<<<< HEAD
=======
        <div className="bg-surface border-t border-outline-variant p-4 flex items-center justify-between">
          <p className="text-caption text-on-surface-variant">
            Showing 1 to {rows.length} of {monthlySummary.totalEmployees} entries
          </p>
          <div className="flex gap-1">
            <button type="button" className="px-3 py-1 border border-outline-variant rounded bg-surface-container-lowest text-on-surface-variant disabled:opacity-50" disabled>
              Prev
            </button>
            <button type="button" className="px-3 py-1 border border-primary rounded bg-primary text-on-primary">
              1
            </button>
            <button type="button" className="px-3 py-1 border border-outline-variant rounded bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low">
              2
            </button>
            <button type="button" className="px-3 py-1 border border-outline-variant rounded bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low">
              Next
            </button>
          </div>
        </div>
>>>>>>> origin/payroll
      </div>
    </div>
  )
}

<<<<<<< HEAD
function SummaryCard({ label, value, valueClass, highlight }: { label: string; value: string; valueClass?: string; highlight?: boolean }) {
  return (
    <div className={cn('bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col justify-center h-[120px]', highlight && 'ring-1 ring-primary')}>
      <p className={cn('text-caption text-on-surface-variant uppercase tracking-wider mb-1', highlight && 'text-primary font-semibold')}>{label}</p>
=======
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
        'bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col justify-center h-[120px]',
        highlight && 'ring-1 ring-primary'
      )}
    >
      <p
        className={cn(
          'text-caption text-on-surface-variant uppercase tracking-wider mb-1',
          highlight && 'text-primary font-semibold'
        )}
      >
        {label}
      </p>
>>>>>>> origin/payroll
      <p className={cn('text-headline-lg font-semibold text-on-surface', valueClass)}>{value}</p>
    </div>
  )
}
