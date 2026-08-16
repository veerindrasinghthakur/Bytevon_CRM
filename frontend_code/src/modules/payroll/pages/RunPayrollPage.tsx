import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { payrollEmployees, formatMoney } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const checks = [
<<<<<<< HEAD
  { ok: true, title: 'Employee salary configuration available', detail: 'All active employees have a base salary set.' },
  { ok: true, title: 'Monthly attendance summary available', detail: 'Timesheets are approved for 42/42 employees.' },
  { ok: true, title: 'No existing payroll for this month', detail: 'October 2023 is clear to generate.' },
  { ok: false, title: 'Attendance summary is not locked', detail: 'Lock the attendance period before generating.', action: 'Lock Attendance Now' },
=======
  {
    ok: true,
    title: 'Employee salary configuration available',
    detail: 'All active employees have a base salary set.',
  },
  {
    ok: true,
    title: 'Monthly attendance summary available',
    detail: 'Timesheets are approved for 42/42 employees.',
  },
  {
    ok: true,
    title: 'No existing payroll for this month',
    detail: 'October 2023 is clear to generate.',
  },
  {
    ok: false,
    title: 'Attendance summary is not locked',
    detail: 'Lock the attendance period before generating.',
    action: 'Lock Attendance Now',
  },
>>>>>>> origin/payroll
]

export function RunPayrollPage() {
  const navigate = useNavigate()
  const hasIssues = checks.some((c) => !c.ok)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Run Monthly Payroll"
        description="Generate payroll records for the current period."
        actions={
<<<<<<< HEAD
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">history</span>} onClick={() => navigate({ to: '/payroll/monthly' })}>
=======
          <Button
            variant="outline"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">history</span>}
            onClick={() => navigate({ to: '/payroll/monthly' })}
          >
>>>>>>> origin/payroll
            Past Payrolls
          </Button>
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
                <select className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-3 pr-8 text-body-md focus:ring-1 focus:ring-primary outline-none">
<<<<<<< HEAD
                  <option>October</option>
=======
                  <option selected>October</option>
>>>>>>> origin/payroll
                  <option>November</option>
                  <option>December</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label-bold text-on-surface-variant uppercase">Year</label>
                <select className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-3 pr-8 text-body-md focus:ring-1 focus:ring-primary outline-none">
<<<<<<< HEAD
                  <option>2023</option>
=======
                  <option selected>2023</option>
>>>>>>> origin/payroll
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
              <span className="bg-error-container text-error font-bold text-[12px] px-2 py-1 rounded-full flex items-center gap-1">
<<<<<<< HEAD
                <span className="material-symbols-outlined text-[14px]">warning</span> 1 Issue
=======
                <span className="material-symbols-outlined text-[14px]">warning</span>
                1 Issue
>>>>>>> origin/payroll
              </span>
            </div>
            <ul className="space-y-3">
              {checks.map((c) => (
<<<<<<< HEAD
                <li key={c.title} className={cn('flex items-start gap-3 p-3 rounded-lg border', c.ok ? 'bg-surface border-outline-variant' : 'bg-error-container border-error')}>
                  <span className={cn('material-symbols-outlined mt-0.5', c.ok ? 'text-success-emerald' : 'text-error')} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {c.ok ? 'check_circle' : 'error'}
                  </span>
                  <div>
                    <p className={cn('text-body-md font-medium', c.ok ? 'text-on-surface' : 'text-error')}>{c.title}</p>
                    <p className={cn('text-caption', c.ok ? 'text-on-surface-variant' : 'text-on-error-container')}>{c.detail}</p>
                    {c.action && (
                      <button type="button" className="mt-2 text-error font-bold text-[12px] underline">{c.action}</button>
=======
                <li
                  key={c.title}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    c.ok
                      ? 'bg-surface border-outline-variant'
                      : 'bg-error-container border-error'
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined mt-0.5',
                      c.ok ? 'text-success-emerald' : 'text-error'
                    )}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {c.ok ? 'check_circle' : 'error'}
                  </span>
                  <div>
                    <p className={cn('text-body-md font-medium', c.ok ? 'text-on-surface' : 'text-error')}>
                      {c.title}
                    </p>
                    <p className={cn('text-caption', c.ok ? 'text-on-surface-variant' : 'text-on-error-container')}>
                      {c.detail}
                    </p>
                    {c.action && (
                      <button type="button" className="mt-2 text-error font-bold text-[12px] underline">
                        {c.action}
                      </button>
>>>>>>> origin/payroll
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-2">
<<<<<<< HEAD
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
=======
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
>>>>>>> origin/payroll
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h2 className="text-headline-md font-semibold text-deep-navy">Preview & Metrics</h2>
              </div>
<<<<<<< HEAD
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-bright border-b border-outline-variant">
                  <tr>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase">Employee</th>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-right">Gross</th>
=======
              <button type="button" className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-surface">
              {[
                { label: 'Total Employees', value: '42', bar: 'bg-electric-blue' },
                { label: 'Gross Salary', value: '$245,600', bar: 'bg-surface-tint' },
                { label: 'Total Additions', value: '+$12,400', bar: 'bg-success-emerald', valueClass: 'text-success-emerald' },
                { label: 'Total Deductions', value: '-$45,200', bar: 'bg-warning-amber', valueClass: 'text-error' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant relative overflow-hidden"
                >
                  <div className={cn('absolute top-0 left-0 w-1 h-full', m.bar)} />
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
>>>>>>> origin/payroll
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-right">Net</th>
                    <th className="p-4 text-label-bold text-on-surface-variant uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {payrollEmployees.slice(0, 4).map((r) => (
                    <tr key={r.id} className="h-[72px] hover:bg-surface transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
<<<<<<< HEAD
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-bold">{r.initials}</div>
=======
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-bold">
                            {r.initials}
                          </div>
>>>>>>> origin/payroll
                          <div>
                            <p className="text-body-md font-bold text-deep-navy">{r.name}</p>
                            <p className="text-caption text-on-surface-variant">{r.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">{formatMoney(r.gross)}</td>
<<<<<<< HEAD
                      <td className="p-4 text-right font-bold text-deep-navy">{formatMoney(r.net)}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">Ready</span>
=======
                      <td className="p-4 text-right text-success-emerald">+{formatMoney(r.earnings)}</td>
                      <td className="p-4 text-right text-error">-{formatMoney(r.deductions)}</td>
                      <td className="p-4 text-right font-bold text-deep-navy">{formatMoney(r.net)}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim">
                          Ready
                        </span>
>>>>>>> origin/payroll
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-surface-container-low rounded-xl shadow-sm border border-primary-fixed-dim p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-label-bold text-on-surface-variant uppercase mb-2">Estimated Net Payroll</p>
              <p className="text-headline-xl font-black text-primary tracking-tight">$212,800.00</p>
<<<<<<< HEAD
            </div>
            <button
              type="button"
              disabled={hasIssues}
              onClick={() => navigate({ to: '/payroll/generating' })}
              className={cn(
                'w-full md:w-auto flex items-center justify-center gap-2 font-semibold text-headline-md px-8 py-4 rounded-xl',
                hasIssues
                  ? 'bg-on-surface-variant text-on-secondary cursor-not-allowed opacity-70'
                  : 'bg-primary text-on-primary hover:bg-primary-container shadow-sm'
              )}
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Generate Payroll
            </button>
=======
              <div className="flex items-center gap-4 mt-2">
                <span className="text-caption text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  Period: Oct 2023
                </span>
                <span className="text-caption text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  42 Employees processed
                </span>
              </div>
            </div>
            <div className="w-full md:w-auto text-center md:text-right">
              <button
                type="button"
                disabled={hasIssues}
                onClick={() => navigate({ to: '/payroll/generating' })}
                className={cn(
                  'w-full md:w-auto flex items-center justify-center gap-2 font-semibold text-headline-md px-8 py-4 rounded-xl',
                  hasIssues
                    ? 'bg-on-surface-variant text-on-secondary cursor-not-allowed opacity-70'
                    : 'bg-primary text-on-primary hover:bg-primary-container shadow-sm'
                )}
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Generate Payroll
              </button>
              {hasIssues && (
                <p className="mt-2 text-caption text-error">Resolve validation issues to generate.</p>
              )}
            </div>
>>>>>>> origin/payroll
          </section>
        </div>
      </div>
    </div>
  )
}
