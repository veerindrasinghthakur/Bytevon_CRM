import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useRunPayroll } from '../../hooks/run/use-run-payroll'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { toast } from '@/shared/hooks/use-toast'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import type { PayrollEmployeeRow } from '../../types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function RunPayrollPage() {
  const navigate = useNavigate()
  const { checks, previewMetrics, previewRows, estimatedNet, employeeCount, formatMoney, runMut, isRunning } =
    useRunPayroll()
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  const handleGenerate = () => {
    runMut.mutate(
      { year: Number(year), month: Number(month) },
      {
        onSuccess: () => {
          toast.success('Payroll run started')
          safeNavigate(navigate, {
            to: payrollRoutes.generating,
            search: { year: Number(year), month: Number(month) },
          })
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, 'Could not start payroll run'))
        },
      },
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-md">
        <button
          type="button"
          className="hover:text-secondary transition-colors"
          onClick={() => safeNavigate(navigate, { to: payrollRoutes.root })}
        >
          Payroll
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-background font-medium">Run Monthly Payroll</span>
      </div>

      <PageHeader
        title="Run Monthly Payroll"
        description="Generate payroll records for the current period."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">arrow_back</span>}
              onClick={() => safeNavigate(navigate, { to: payrollRoutes.root })}
            >
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">history</span>}
              onClick={() => safeNavigate(navigate, { to: payrollRoutes.monthly })}
            >
              Past Payrolls
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="space-y-4 lg:col-span-1">
          <section className="bv-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h2 className="text-headline-md font-semibold text-on-background">Payroll Period</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label-bold text-on-surface-variant uppercase">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-3 pr-8 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={String(i + 1)}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label-bold text-on-surface-variant uppercase">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-3 pr-8 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="bv-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                <h2 className="text-headline-md font-semibold text-on-background">Validation Checks</h2>
              </div>
              <span className="bg-secondary/15 text-secondary font-bold text-[12px] px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Ready
              </span>
            </div>
            <ul className="space-y-3">
              {checks.map((c) => (
                <li
                  key={c.title}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-surface-container-lowest border-outline-variant"
                >
                  <span
                    className="material-symbols-outlined mt-0.5 text-secondary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <div>
                    <p className="text-body-md font-medium text-on-background">{c.title}</p>
                    <p className="text-caption text-on-surface-variant">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <section className="bv-surface overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h2 className="text-headline-md font-semibold text-on-background">Preview & Metrics</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
              {previewMetrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant card-hover"
                >
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">{m.label}</p>
                  <p className={cn('text-headline-lg font-semibold text-on-background', m.valueClass)}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-auto border-t border-outline-variant">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-bright sticky top-0 border-b border-outline-variant">
                  <tr>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase">Employee</th>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-right">Gross</th>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-right">Earnings</th>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-right">Deductions</th>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-right">Net</th>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {previewRows.map((r: PayrollEmployeeRow) => (
                    <tr key={r.id} className="h-[72px] zebra-row">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-label-bold">
                            {r.initials}
                          </div>
                          <div>
                            <p className="text-body-md font-bold text-on-background">{r.name}</p>
                            <p className="text-caption text-on-surface-variant">{r.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right text-on-background">{formatMoney(r.gross)}</td>
                      <td className="p-4 text-right text-secondary">+{formatMoney(r.earnings)}</td>
                      <td className="p-4 text-right text-error">-{formatMoney(r.deductions)}</td>
                      <td className="p-4 text-right font-bold text-on-background">{formatMoney(r.net)}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                          Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-surface-container-low rounded-xl executive-shadow border border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-label-bold text-on-surface-variant uppercase mb-2">Estimated Net Payroll</p>
              <p className="text-headline-lg font-bold text-primary tracking-tight">{estimatedNet}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-caption text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  Selected period
                </span>
                <span className="text-caption text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  {employeeCount} Employees
                </span>
              </div>
            </div>
            <Can action={Action.CREATE} resource="payroll">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isRunning}
                className="w-full md:w-auto flex items-center justify-center gap-2 font-semibold text-body-md px-8 py-4 rounded-xl bg-primary text-on-primary hover:opacity-90 executive-shadow transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                {isRunning ? 'Starting…' : 'Generate Payroll'}
              </button>
            </Can>
          </section>
        </div>
      </div>
    </div>
  )
}
