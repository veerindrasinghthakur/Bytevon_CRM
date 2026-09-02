import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Select } from '@/shared/components/ui/Select'
import { useReviseSalary } from '../hooks/use-payroll'
import { SALARY_ITEM_TYPE_OPTIONS } from '../schemas/enums'
import { payrollRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'

export function ReviseSalaryPage() {
  const navigate = useNavigate()
  const {
    emp,
    rows,
    effectiveFrom,
    setEffectiveFrom,
    totalEarnings,
    totalDeductions,
    net,
    formatMoney,
    addRow,
    removeRow,
    updateRow,
    saveMut,
    isLoading,
  } = useReviseSalary()

  if (isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading salary structure…</div>
  }
  if (!emp) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">Employee not found.</p>
        <BackButton to={payrollRoutes.salary} />
      </div>
    )
  }

  const backToDetail = () =>
    safeNavigate(navigate, {
      to: payrollRoutes.salaryDetailPath,
      params: { employeeId: emp.id },
    })

  const handleSave = () => {
    saveMut.mutate(undefined, {
      onSuccess: () => backToDetail(),
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-on-surface-variant text-label-md flex-wrap">
          <button
            type="button"
            className="hover:text-secondary transition-colors"
            onClick={() => safeNavigate(navigate, { to: payrollRoutes.root })}
          >
            Payroll
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button
            type="button"
            className="hover:text-secondary transition-colors"
            onClick={() => safeNavigate(navigate, { to: payrollRoutes.salary })}
          >
            Salary Management
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <button type="button" className="hover:text-secondary transition-colors" onClick={backToDetail}>
            {emp.name}
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-background font-medium">Revise Salary</span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BackButton to={payrollRoutes.salaryDetail(emp.id)} label="" className="!px-1" />
            <div>
              <h1 className="text-headline-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Revise Salary
              </h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                Update the existing salary structure for {emp.name}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={backToDetail} disabled={saveMut.isPending}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saveMut.isPending}>
              {saveMut.isPending ? 'Saving…' : 'Save Salary'}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="bv-surface p-6 flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xl border border-outline-variant">
              {emp.initials}
            </div>
            <div className="flex-1">
              <h2 className="text-title-lg font-semibold text-on-background">{emp.name}</h2>
              <p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-1">
                <span className="text-label-md text-primary bg-primary-fixed px-2 py-0.5 rounded">{emp.code}</span>
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-2 border-t border-outline-variant">
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Department</p>
                  <p className="text-body-md text-on-background font-medium mt-1">{emp.department}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Position</p>
                  <p className="text-body-md text-on-background font-medium mt-1">{emp.role}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bv-surface overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-bright">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">tune</span>
                Salary Items Configuration
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-12 gap-4 mb-3 text-label-sm text-on-surface-variant uppercase tracking-wide px-2">
                <div className="col-span-5">
                  Item Name <span className="text-error">*</span>
                </div>
                <div className="col-span-3">
                  Type <span className="text-error">*</span>
                </div>
                <div className="col-span-3">
                  Amount <span className="text-error">*</span>
                </div>
                <div className="col-span-1 text-center">Act</div>
              </div>
              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-12 gap-4 items-center bg-surface-container p-2 rounded-lg border border-outline-variant"
                  >
                    <div className="col-span-5">
                      <input
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={row.type}
                        onChange={(v) => updateRow(row.id, { type: v as 'EARNING' | 'DEDUCTION' })}
                        options={[...SALARY_ITEM_TYPE_OPTIONS]}
                        minWidthClass="min-w-0"
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-3 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-sm text-on-surface-variant">
                        $
                      </span>
                      <input
                        type="number"
                        className={`w-full bg-surface-container-lowest border border-outline-variant rounded-md pl-7 pr-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none text-right font-medium transition-colors ${
                          row.type === 'DEDUCTION' ? 'text-error' : ''
                        }`}
                        value={row.amount}
                        onChange={(e) => updateRow(row.id, { amount: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        className="p-1.5 text-outline hover:text-error hover:bg-error-container rounded-md transition-colors"
                        onClick={() => removeRow(row.id)}
                        title="Remove Item"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addRow}
                className="mt-4 flex items-center gap-2 text-label-md text-primary hover:text-secondary px-3 py-2 rounded-lg hover:bg-primary-fixed transition-colors border border-dashed border-primary w-full justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add Salary Item
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary">calendar_month</span>
              Effective Period
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-label-md text-on-background mb-1">
                  Effective From <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-on-background mb-1">Effective To</label>
                <input
                  type="date"
                  disabled
                  readOnly
                  value=""
                  className="w-full bg-surface-container border border-outline-variant rounded-md px-3 py-2 text-body-sm text-on-surface-variant cursor-not-allowed opacity-70 outline-none"
                  title="Effective To is system-managed and cannot be edited"
                />
                <p className="text-body-sm text-on-surface-variant mt-1 text-[11px]">
                  Locked — continuous until the next revision. Not editable.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-primary text-on-primary rounded-xl p-6 executive-shadow relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10">
              <span className="material-symbols-outlined text-[120px]">account_balance</span>
            </div>
            <h3 className="text-title-lg font-semibold text-on-primary flex items-center gap-2 mb-4 relative z-10">
              <span className="material-symbols-outlined text-inverse-primary">summarize</span>
              Calculation Summary
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center pb-3 border-b border-on-primary/10">
                <span className="text-body-md text-inverse-primary">Total Earnings</span>
                <span className="text-label-md text-on-primary tracking-wider">{formatMoney(totalEarnings)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-on-primary/10">
                <span className="text-body-md text-inverse-primary">Total Deductions</span>
                <span className="text-label-md text-error-container tracking-wider">
                  -{formatMoney(totalDeductions)}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-label-sm text-inverse-primary uppercase tracking-widest block mb-1">
                  Net Gross Salary
                </span>
                <div className="text-headline-lg font-bold text-on-primary tracking-tight">{formatMoney(net)}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
