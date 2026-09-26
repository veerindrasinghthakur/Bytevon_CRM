import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { useSalaryDetail } from '../../hooks/salary/use-salary-detail'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

/** Single employee gross-salary view. Revise + history links. */
export function EmployeeSalaryDetailPage() {
  const navigate = useNavigate()
  const { employeeId, emp, structure, versions, gross, formatMoney, isLoading, detailError } =
    useSalaryDetail()

  useDeletedRedirect({ ready: !isLoading, data: emp, error: detailError, listTo: payrollRoutes.salary })

  if (isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading salary…</div>
  }
  if (!emp) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">Employee not found.</p>
        <BackButton to={payrollRoutes.salary} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-on-surface-variant text-label-md">
          <button type="button" className="hover:text-secondary transition-colors" onClick={() => safeNavigate(navigate, { to: payrollRoutes.root })}>
            Payroll
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button type="button" className="hover:text-secondary transition-colors" onClick={() => safeNavigate(navigate, { to: payrollRoutes.salary })}>
            Salary Management
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-background font-medium">{emp.name}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton to={payrollRoutes.salary} label="" className="!px-1" />
            <div>
              <h1 className="text-headline-lg font-semibold text-on-background">Employee Salary</h1>
              <p className="text-body-md text-on-surface-variant mt-0.5">Gross salary configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bv-surface px-6 py-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
              {emp.initials}
            </div>
            <div>
              <h2 className="text-title-lg font-semibold text-on-background">{emp.name}</h2>
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

      <section className="bv-surface card-hover p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex gap-12 flex-wrap">
          <div>
            <p className="text-on-surface-variant text-label-md uppercase tracking-wider mb-2">Gross Salary</p>
            <p className="text-display-lg font-bold text-on-background">
              {formatMoney(gross)}
              <span className="text-headline-md text-on-surface-variant font-normal">/mo</span>
            </p>
          </div>
          <div className="pt-2">
            <p className="text-on-surface-variant text-label-md uppercase tracking-wider mb-2">Effective From</p>
            <p className="text-title-lg font-semibold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">calendar_month</span>
              {structure?.effectiveFrom ?? emp.effectiveFrom ?? '—'}
            </p>
          </div>
          <div className="pt-2">
            <p className="text-on-surface-variant text-label-md uppercase tracking-wider mb-2">Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold status-badge status-success">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5" />
              {structure?.status ?? emp.salaryStatus ?? 'ACTIVE'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<span className="material-symbols-outlined">history</span>}
            onClick={() =>
              safeNavigate(navigate, {
                to: payrollRoutes.historyEmployeePath,
                params: { employeeId },
              })
            }
          >
            Salary History
          </Button>
          <Can action={Action.UPDATE} resource="salary" minScope="ORGANIZATION">
            <Button
              variant="primary"
              size="md"
              leftIcon={
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  edit_document
                </span>
              }
              onClick={() =>
                safeNavigate(navigate, {
                  to: payrollRoutes.salaryRevisePath,
                  params: { employeeId },
                })
              }
            >
              Revise Salary
            </Button>
          </Can>
        </div>
      </section>

      <section className="bv-surface p-6">
        <h3 className="text-title-lg font-semibold text-on-background mb-4">Salary structure</h3>
        <p className="text-body-md text-on-surface-variant mb-6">
          Configured earnings and fixed deductions. Period variables (OT, TDS, adjustments) are computed during
          monthly payroll runs.
        </p>
        {structure ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Earnings</h4>
              <ul className="space-y-2">
                {structure.items
                  .filter((i) => i.type === 'EARNING')
                  .map((i) => (
                    <li key={i.id} className="flex justify-between text-body-md border-b border-outline-variant/50 py-2">
                      <span>{i.name}</span>
                      <span className="font-medium">{formatMoney(i.amount)}</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Deductions</h4>
              <ul className="space-y-2">
                {structure.items
                  .filter((i) => i.type === 'DEDUCTION')
                  .map((i) => (
                    <li key={i.id} className="flex justify-between text-body-md border-b border-outline-variant/50 py-2">
                      <span>{i.name}</span>
                      <span className="font-medium text-error">-{formatMoney(i.amount)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant">No salary structure on file.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant card-hover">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Gross / month</p>
            <p className="text-headline-md font-bold text-on-background">{formatMoney(gross)}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant card-hover">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Currency</p>
            <p className="text-headline-md font-bold text-on-background">{structure?.currency ?? emp.currency ?? 'USD'}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant card-hover">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Pay frequency</p>
            <p className="text-headline-md font-bold text-on-background">{structure?.payFrequency ?? 'Monthly'}</p>
          </div>
        </div>
      </section>

      <section className="bv-surface p-6">
        <h3 className="text-title-lg font-semibold text-on-background mb-1">Version history</h3>
        <p className="text-body-md text-on-surface-variant mb-6">
          Every change creates a new version — versions are never edited. The open version applies
          until the next revision.
        </p>
        {versions.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">No versions on file.</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {versions.map((v, idx) => {
              const vGross = v.items
                .filter((i) => i.type === 'EARNING')
                .reduce((s, i) => s + (Number(i.amount) || 0), 0)
              const open = !v.effectiveTo
              return (
                <li key={`${v.effectiveFrom}-${idx}`} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">history</span>
                    <div>
                      <p className="text-body-md font-medium text-on-background">
                        {v.effectiveFrom || '—'} → {v.effectiveTo ?? 'Open'}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        {v.items.length} items · {v.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-body-md font-semibold text-on-background">
                      {formatMoney(vGross)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold status-badge status-success">
                      {open ? 'CURRENT' : 'CLOSED'}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
