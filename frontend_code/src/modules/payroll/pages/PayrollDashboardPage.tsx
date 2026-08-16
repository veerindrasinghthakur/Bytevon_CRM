import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import {
  payrollEmployees,
  payrollKpis,
  periodMeta,
  recentActivity,
  formatMoney,
  formatMoneyShort,
} from '../data/mock'
import { cn } from '@/shared/lib/cn'

const statusStyles: Record<string, string> = {
  Approved: 'bg-warning-amber/10 text-warning-amber',
  Calculated: 'bg-surface-variant text-primary',
  Paid: 'bg-success-emerald/10 text-success-emerald',
}

export function PayrollDashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payroll"
        description="Manage monthly salary processing, approvals and payments."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/payroll/salary' })}
            >
              Salary Management
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
              onClick={() => navigate({ to: '/payroll/run' })}
            >
              Run Payroll
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Period / Progress */}
          <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <div className="flex justify-between items-start mb-6 border-b border-outline-variant pb-4">
              <div>
                <h2 className="text-headline-md font-semibold text-deep-navy">{periodMeta.label}</h2>
                <p className="text-caption text-on-surface-variant mt-1">Processing cycle currently active</p>
              </div>
              <div className="bg-surface-container px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
                <span className="text-caption text-primary">In Progress</span>
              </div>
            </div>

            <div className="relative flex justify-between items-center w-full px-4 pt-4 mb-2">
              <div className="absolute left-8 right-8 top-1/2 h-[2px] bg-outline-variant/50 -z-0 -translate-y-1/2" />
              {[
                {
                  label: 'CALCULATED',
                  count: periodMeta.calculated,
                  icon: 'check',
                  tone: 'bg-success-emerald text-white',
                  text: 'text-success-emerald',
                },
                {
                  label: 'APPROVED',
                  count: periodMeta.approved,
                  icon: 'more_horiz',
                  tone: 'bg-warning-amber text-white',
                  text: 'text-warning-amber',
                },
                {
                  label: 'PAID',
                  count: periodMeta.paid,
                  icon: 'hourglass_empty',
                  tone: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant',
                  text: 'text-on-surface-variant opacity-60',
                },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-surface-container-lowest',
                      s.tone
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                  </div>
                  <span className={cn('text-label-bold font-bold text-[12px]', s.text)}>{s.label}</span>
                  <span className="text-caption text-on-surface-variant">({s.count})</span>
                </div>
              ))}
            </div>
          </section>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              icon="account_balance_wallet"
              label="Total Payroll"
              value={formatMoneyShort(payrollKpis.totalPayroll)}
              hint={
                <span className="text-success-emerald flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">trending_up</span>
                  +{payrollKpis.trendPct}% vs last month
                </span>
              }
            />
            <KpiCard icon="group" label="Total Employees" value={String(payrollKpis.totalEmployees)} />
            <KpiCard
              icon="pending_actions"
              label="Pending Approval"
              value={String(payrollKpis.pendingApproval)}
              valueClass="text-warning-amber"
              accent="border-l-4 border-l-warning-amber"
            />
            <KpiCard
              icon="payments"
              label="Pending Payment"
              value={String(payrollKpis.pendingPayment)}
              valueClass="text-primary"
              accent="border-l-4 border-l-primary"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <h3 className="text-headline-md font-semibold text-deep-navy mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <QuickAction
                icon="play_arrow"
                iconTone="bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-on-primary"
                label="Run Monthly Payroll"
                onClick={() => navigate({ to: '/payroll/run' })}
              />
              <QuickAction
                icon="manage_accounts"
                iconTone="bg-secondary-container text-on-secondary-container"
                label="Manage Salaries"
                onClick={() => navigate({ to: '/payroll/salary' })}
              />
              <QuickAction
                icon="history"
                iconTone="bg-secondary-container text-on-secondary-container"
                label="View Payroll History"
                onClick={() => navigate({ to: '/payroll/monthly' })}
              />
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm flex-1">
            <h3 className="text-headline-md font-semibold text-deep-navy mb-4">Recent Activity</h3>
            <div className="relative pl-4 border-l border-outline-variant space-y-6">
              {recentActivity.map((a) => (
                <div key={a.id} className="relative">
                  <div
                    className={cn(
                      'absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest',
                      a.primary ? 'bg-primary' : 'bg-outline-variant'
                    )}
                  />
                  <p className="text-body-md text-deep-navy">{a.text}</p>
                  <p className="text-caption text-on-surface-variant mt-1">{a.time}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Summary table */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="text-headline-md font-semibold text-deep-navy">Payroll Summary</h3>
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-outline-variant rounded focus:ring-1 focus:ring-primary focus:border-primary text-body-md"
              placeholder="Search employee..."
              type="text"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-label-bold text-on-surface-variant uppercase">
                <th className="p-4 pl-6 font-normal">Employee</th>
                <th className="p-4 font-normal">Code</th>
                <th className="p-4 font-normal">Dept</th>
                <th className="p-4 text-right font-normal">Gross</th>
                <th className="p-4 text-right font-normal">Earnings</th>
                <th className="p-4 text-right font-normal">Deductions</th>
                <th className="p-4 text-right font-normal text-deep-navy font-semibold">Net</th>
                <th className="p-4 font-normal text-center">Status</th>
                <th className="p-4 pr-6 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {payrollEmployees.slice(0, 3).map((r) => (
                <tr key={r.id} className="h-[72px] hover:bg-surface-container-low transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-label-bold">
                        {r.initials}
                      </div>
                      <div>
                        <div className="text-body-md font-semibold text-deep-navy">{r.name}</div>
                        <div className="text-caption text-on-surface-variant">{r.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-caption text-on-surface-variant">{r.code}</td>
                  <td className="p-4 text-body-md text-deep-navy">{r.department}</td>
                  <td className="p-4 text-body-md text-deep-navy text-right">{formatMoney(r.gross)}</td>
                  <td className="p-4 text-body-md text-success-emerald text-right">
                    +{formatMoney(r.earnings)}
                  </td>
                  <td className="p-4 text-body-md text-error text-right">-{formatMoney(r.deductions)}</td>
                  <td className="p-4 text-body-md font-bold text-deep-navy text-right">{formatMoney(r.net)}</td>
                  <td className="p-4 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide',
                        statusStyles[r.status]
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {r.status === 'Approved' && (
                      <button
                        type="button"
                        className="text-primary text-label-sm hover:underline"
                        onClick={() =>
                          navigate({ to: '/payroll/review/$employeeId', params: { employeeId: r.id } })
                        }
                      >
                        Record Payment
                      </button>
                    )}
                    {r.status === 'Calculated' && (
                      <button
                        type="button"
                        className="text-on-surface-variant text-label-sm hover:text-primary"
                        onClick={() =>
                          navigate({ to: '/payroll/review/$employeeId', params: { employeeId: r.id } })
                        }
                      >
                        Review
                      </button>
                    )}
                    {r.status === 'Paid' && (
                      <button
                        type="button"
                        className="text-on-surface-variant text-label-sm hover:text-primary"
                        onClick={() =>
                          navigate({ to: '/payroll/payslip/$employeeId', params: { employeeId: r.id } })
                        }
                      >
                        View Payslip
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-bright">
          <span className="text-caption text-on-surface-variant">Showing 3 of {payrollKpis.totalEmployees} employees</span>
          <div className="flex items-center gap-2">
            <button type="button" className="p-1 rounded hover:bg-surface-container border border-outline-variant disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-surface-container border border-outline-variant"
              onClick={() => navigate({ to: '/payroll/monthly' })}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  valueClass,
  accent,
}: {
  icon: string
  label: string
  value: string
  hint?: React.ReactNode
  valueClass?: string
  accent?: string
}) {
  return (
    <div
      className={cn(
        'bg-surface-container-lowest rounded-lg p-4 border border-outline-variant shadow-sm h-[120px] flex flex-col justify-between',
        accent
      )}
    >
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-label-sm">{label}</span>
      </div>
      <div>
        <div className={cn('text-headline-lg font-semibold text-deep-navy', valueClass)}>{value}</div>
        {hint && <div className="text-caption mt-1">{hint}</div>}
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  iconTone,
  label,
  onClick,
}: {
  icon: string
  iconTone: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-md transition-colors', iconTone)}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="text-label-sm text-deep-navy">{label}</span>
      </div>
      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">chevron_right</span>
    </button>
  )
}
