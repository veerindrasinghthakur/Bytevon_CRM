import { useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Select } from '@/shared/components/ui/Select'
import { useAddSalary } from '../../hooks/salary/use-add-salary'
import { SALARY_ITEM_TYPE_OPTIONS } from '../../schemas/enums'
import {
  salaryFormSchema,
  type SalaryFormInput,
  emptySalaryItemForm,
  toSaveSalaryInput,
} from '../../schemas/salary-form'
import { payrollRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { toast } from '@/shared/hooks/use-toast'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

/** First salary version for an employment (versioned create, never an update). */
export function AddSalaryPage() {
  const navigate = useNavigate()
  const {
    employmentId,
    setEmploymentId,
    candidates,
    selected,
    formatMoney,
    saveMut,
    isLoading,
    isError,
  } = useAddSalary()

  const form = useForm<SalaryFormInput>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      effectiveFrom: '',
      items: [emptySalaryItemForm()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watched = form.watch()
  const totalEarnings = (watched.items ?? [])
    .filter((r) => r.type === 'EARNING')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const totalDeductions = (watched.items ?? [])
    .filter((r) => r.type === 'DEDUCTION')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const net = totalEarnings - totalDeductions

  const backToList = () => safeNavigate(navigate, { to: payrollRoutes.salary })

  const onSubmit = form.handleSubmit((data) => {
    if (!employmentId) {
      toast.error('Select an employee first')
      return
    }
    const payload = toSaveSalaryInput(data)
    saveMut.mutate(payload, {
      onSuccess: () => {
        toast.success('First salary version created')
        safeNavigate(navigate, {
          to: payrollRoutes.salaryDetailPath,
          params: { employeeId: employmentId },
        })
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Could not create the salary version'))
      },
    })
  })

  if (isLoading) {
    return <div className="p-8 text-body-md text-on-surface-variant">Loading employees…</div>
  }
  if (isError) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-body-md text-error">Could not load eligible employees.</p>
        <BackButton to={payrollRoutes.salary} />
      </div>
    )
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
            onClick={backToList}
          >
            Salary Management
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-background font-medium">Add Payroll</span>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BackButton to={payrollRoutes.salary} label="" className="!px-1" />
            <div>
              <h1 className="text-headline-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                Add Payroll
              </h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                Create the first salary version for an employee without one. Later changes are new
                versions — nothing is ever overwritten.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={backToList} disabled={saveMut.isPending}>
              Cancel
            </Button>
            <Can action={Action.CREATE} resource="salary" minScope="ORGANIZATION">
              <Button variant="primary" size="sm" onClick={() => void onSubmit()} disabled={saveMut.isPending || !employmentId}>
                {saveMut.isPending ? 'Creating…' : 'Create Salary'}
              </Button>
            </Can>
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-secondary">badge</span>
              Employee
            </h3>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Only employments without an open salary version are listed.
            </p>
            {candidates.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">
                Every active employment already has a salary version. Nothing to add.
              </p>
            ) : (
              <Select
                value={employmentId}
                onChange={(v) => setEmploymentId(v)}
                options={candidates.map((c) => ({
                  value: c.id,
                  label: `${c.name} · ${c.code}`,
                }))}
                minWidthClass="min-w-0"
                className="w-full"
              />
            )}
            {selected && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-outline-variant">
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Department</p>
                  <p className="text-body-md text-on-background font-medium mt-1">{selected.department}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Position</p>
                  <p className="text-body-md text-on-background font-medium mt-1">{selected.position}</p>
                </div>
              </div>
            )}
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
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-4 items-center bg-surface-container p-2 rounded-lg border border-outline-variant"
                  >
                    <div className="col-span-5">
                      <input
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                        {...form.register(`items.${index}.name`)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={form.watch(`items.${index}.type`)}
                        onChange={(v) =>
                          form.setValue(`items.${index}.type`, v as 'EARNING' | 'DEDUCTION', {
                            shouldValidate: true,
                          })
                        }
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
                          form.watch(`items.${index}.type`) === 'DEDUCTION' ? 'text-error' : ''
                        }`}
                        {...form.register(`items.${index}.amount`)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        className="p-1.5 text-outline hover:text-error hover:bg-error-container rounded-md transition-colors"
                        onClick={() => remove(index)}
                        title="Remove Item"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.items?.message && (
                <p className="text-body-sm text-error mt-2">{form.formState.errors.items.message}</p>
              )}
              <button
                type="button"
                onClick={() => append(emptySalaryItemForm())}
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
                  {...form.register('effectiveFrom')}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                />
                {form.formState.errors.effectiveFrom && (
                  <p className="text-body-sm text-error mt-1">{form.formState.errors.effectiveFrom.message}</p>
                )}
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
                  Locked — first version stays open until the next revision. Not editable.
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
                  Gross Salary (sent as version gross)
                </span>
                <div className="text-headline-lg font-bold text-on-primary tracking-tight">{formatMoney(totalEarnings)}</div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
