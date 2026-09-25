import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { Can } from '@/shared/rbac'
import { formatMoney } from '@/shared/mock/data/payroll'
import { listEmployments } from '@/modules/workforce/api/employment'
import { usePayrollHistory, useHistoryEmployee } from '../../hooks/history/use-payroll-history'
import { payrollHistoryStatusStyles } from '../../schemas/enums'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

export function PayrollHistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')

  const historyQuery = usePayrollHistory(search)

  const records = historyQuery.records

  const workforceQuery = useQuery({
    queryKey: ['workforce', 'employments', { page: 1, pageSize: 500 }],
    queryFn: () => listEmployments({ page: 1, pageSize: 500 }),
    staleTime: 60_000,
  })
  const deptByEmployee = useMemo(() => {
    const map = new Map<string, string>()
    const data = workforceQuery.data as
      | { items?: Array<Record<string, unknown>> }
      | Array<Record<string, unknown>>
      | undefined
    const items = Array.isArray(data) ? data : (data?.items ?? [])
    for (const row of items) {
      const id = String(row.employmentId ?? row.employment_id ?? row.id ?? '')
      const dept = String(row.departmentName ?? row.department_name ?? row.department ?? '—')
      if (id) map.set(id, dept)
    }
    return map
  }, [workforceQuery.data])

  const monthOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.period.slice(0, 7)))
    return ['All', ...[...set].sort().reverse()]
  }, [records])
  const departmentOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of records) set.add(deptByEmployee.get(r.employeeId) ?? '—')
    return ['All', ...[...set].sort()]
  }, [records, deptByEmployee])

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (monthFilter !== 'All' && !r.period.startsWith(monthFilter)) return false
        if (departmentFilter !== 'All' && (deptByEmployee.get(r.employeeId) ?? '—') !== departmentFilter)
          return false
        return true
      }),
    [records, monthFilter, departmentFilter, deptByEmployee],
  )

  const totalPaid = filtered.reduce((s, r) => s + r.net, 0)
  const avgPaid = filtered.length ? Math.round(totalPaid / filtered.length) : 0
  const byDept = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of filtered) {
      const dept = deptByEmployee.get(r.employeeId) ?? '—'
      map.set(dept, (map.get(dept) ?? 0) + r.net)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [filtered, deptByEmployee])
  const topDept = byDept[0]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Payroll History"
        description="Past paid salary records across the organization. Read-only."
        actions={
          <ExportButton
            resource="payroll"
            filenameStem="payroll-history"
            variant="outline"
            size="sm"
            label="Export"
          />
        }
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
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
          <div className="flex flex-wrap items-center gap-3 ml-auto lg:mr-3 lg:pr-2">
            <Select
              value={monthFilter}
              onChange={setMonthFilter}
              aria-label="Filter by month"
              minWidthClass="min-w-[150px]"
              options={monthOptions.map((m) => ({
                value: m,
                label: m === 'All' ? 'Month: All' : m,
              }))}
            />
            <Select
              value={departmentFilter}
              onChange={setDepartmentFilter}
              aria-label="Filter by department"
              minWidthClass="min-w-[170px]"
              options={departmentOptions.map((d) => ({
                value: d,
                label: d === 'All' ? 'Department: All' : d,
              }))}
            />
          </div>
        </div>
        <p className="text-caption text-on-surface-variant text-right">
          {historyQuery.isLoading ? 'Loading…' : `${filtered.length} paid records`}
        </p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bv-surface p-5">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-headline-md font-bold text-on-background">
            {historyQuery.isLoading ? '…' : formatMoney(totalPaid)}
          </p>
        </div>
        <div className="bv-surface p-5">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Avg Payout</p>
          <p className="text-headline-md font-bold text-on-background">
            {historyQuery.isLoading ? '…' : formatMoney(avgPaid)}
          </p>
        </div>
        <div className="bv-surface p-5">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Top Department</p>
          <p className="text-headline-md font-bold text-secondary">
            {historyQuery.isLoading ? '…' : (topDept ? topDept[0] : '—')}
          </p>
          {topDept && (
            <p className="text-body-sm text-on-surface-variant mt-1">{formatMoney(topDept[1])} paid</p>
          )}
        </div>
        <div className="bv-surface p-5">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Records</p>
          <p className="text-headline-md font-bold text-on-background">
            {historyQuery.isLoading ? '…' : filtered.length}
          </p>
        </div>
      </section>

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
              {filtered.map((r) => (
                <HistoryRow key={r.id} record={r} navigate={navigate} />
              ))}
              {!historyQuery.isLoading && filtered.length === 0 && (
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
          <Can action="VIEW" resource="payroll">
            <button
              type="button"
              title="Payslip"
              aria-label="Payslip"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-primary hover:text-secondary hover:bg-surface-container transition-colors"
              onClick={() =>
                safeNavigate(navigate, {
                  to: payrollRoutes.payslipPath,
                  params: { payrollId: record.payrollId ?? record.id },
                })
              }
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </button>
          </Can>
          <Can action="VIEW" resource="employment">
            <button
              type="button"
              title="History"
              aria-label="History"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors"
              onClick={() =>
                safeNavigate(navigate, {
                  to: payrollRoutes.historyEmployeePath,
                  params: { employeeId: record.employeeId },
                })
              }
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
            </button>
          </Can>
        </div>
      </td>
    </tr>
  )
}
