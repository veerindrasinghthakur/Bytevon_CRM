import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees, formatMoney } from '../data/mock'
import { cn } from '@/shared/lib/cn'

/** Simple ready state — validation informational, generate always available. */
const checks = [
  {
    ok: true,
    title: 'Employee salary configuration available',
    detail: 'All active employees have a base salary set.',
  },
  {
    ok: true,
    title: 'Monthly attendance summary available',
    detail: 'Timesheets are available for processing.',
  },
  {
    ok: true,
    title: 'No existing payroll for this month',
    detail: 'Selected period is clear to generate.',
  },
  {
    ok: true,
    title: 'Period ready',
    detail: 'You can generate payroll for the selected month.',
  },
]

export function RunPayrollPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-on-surface-variant text-label-md">
        <button type="button" className="hover:text-secondary transition-colors" onClick={() => navigate({ to: '/payroll' })}>
          Payroll
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-deep-navy font-medium">Run Monthly Payroll</span>
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
              onClick={() => navigate({ to: '/payroll' })}
            >
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">history</span>}
              onClick={() => navigate({ to: '/payroll/monthly' })}
            >
              Past Payrolls
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="space-y-4 lg:col-span-1">
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h2 className="text-headline-md font-semibold text-deep-navy">Payroll Period</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label-bold text-on-surface-variant uppercase">Month</label>
                <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-3 pr-8 text-body-md focus:ring-1 focus:ring-primary outline-none">
                  <option>October</option>
                  <option>November</option>
                  <option>December</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label-bold text-on-surface-variant uppercase">Year</label>
                <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-3 pr-8 text-body-md focus:ring-1 focus:ring-primary outline-none">
                  <option>2023</option>
                  <option>2024</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                <h2 className="text-headline-md font-semibold text-deep-navy">Validation Checks</h2>
              </div>
              <span className="bg-success-emerald/10 text-success-emerald font-bold text-[12px] px-2 py-1 rounded-full flex items-center gap-1">
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
                    className="material-symbols-outlined mt-0.5 text-success-emerald"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <div>
                    <p className="text-body-md font-medium text-deep-navy">{c.title}</p>
                    <p className="text-caption text-on-surface-variant">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h2 className="text-headline-md font-semibold text-deep-navy">Preview & Metrics</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
              {[
                { label: 'Total Employees', value: '42' },
                { label: 'Gross Salary', value: '$245,600' },
                { label: 'Total Additions', value: '+$12,400', valueClass: 'text-success-emerald' },
                { label: 'Total Deductions', value: '-$45,200', valueClass: 'text-error' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant"
                >
                  <p className="text-label-bold text-on-surface-variant uppercase mb-1">{m.label}</p>
                  <p className={cn('text-headline-lg font-semibold text-deep-navy', m.valueClass)}>{m.value}</p>
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
                  {payrollEmployees.slice(0, 4).map((r) => (
                    <tr key={r.id} className="h-[72px] bv-row-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-label-bold">
                            {r.initials}
                          </div>
                          <div>
                            <p className="text-body-md font-bold text-deep-navy">{r.name}</p>
                            <p className="text-caption text-on-surface-variant">{r.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right text-deep-navy">{formatMoney(r.gross)}</td>
                      <td className="p-4 text-right text-success-emerald">+{formatMoney(r.earnings)}</td>
                      <td className="p-4 text-right text-error">-{formatMoney(r.deductions)}</td>
                      <td className="p-4 text-right font-bold text-deep-navy">{formatMoney(r.net)}</td>
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

          <section className="bg-surface-container-low rounded-xl shadow-sm border border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-label-bold text-on-surface-variant uppercase mb-2">Estimated Net Payroll</p>
              <p className="text-headline-lg font-bold text-primary tracking-tight">$212,800.00</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-caption text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  Selected period
                </span>
                <span className="text-caption text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  42 Employees
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: '/payroll/generating' })}
              className="w-full md:w-auto flex items-center justify-center gap-2 font-semibold text-body-md px-8 py-4 rounded-xl bg-deep-navy text-on-primary hover:opacity-90 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Generate Payroll
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
