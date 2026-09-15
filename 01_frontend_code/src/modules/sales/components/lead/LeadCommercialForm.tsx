import type { UseFormReturn } from 'react-hook-form'
import { Select } from '@/shared/components/ui/Select'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import type { LeadFormSchemaInput } from '../../schemas/lead/lead-form'
import { fieldClass, labelClass } from './lead-form-styles'

type SelectOption = { value: string; label: string }

type Props = {
  form: UseFormReturn<LeadFormSchemaInput>
  assignedValue: string
  employeeOptions: SelectOption[]
  employeesLoading: boolean
  employeesError: unknown
}

/** Budget, expected close date, and assignee. */
export function LeadCommercialForm({
  form,
  assignedValue,
  employeeOptions,
  employeesLoading,
  employeesError,
}: Props) {
  return (
    <section className="bv-surface p-6 space-y-4">
      <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">payments</span>
        Commercial
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="budget">
            Estimated budget / quotation
          </label>
          <input
            id="budget"
            type="number"
            min={0}
            step="0.01"
            {...form.register('budget')}
            className={fieldClass}
            placeholder="120000"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="date">
            Expected close date
          </label>
          <input id="date" type="date" {...form.register('date')} className={fieldClass} />
        </div>
        <div>
          <Select
            label="Assigned representative"
            value={assignedValue}
            onChange={(v) => form.setValue('assignedEmploymentId', v)}
            placeholder="Select employee"
            options={employeeOptions}
            minWidthClass="w-full"
            disabled={employeesLoading}
          />
          {employeesError != null && (
            <p className="text-[11px] text-error mt-1">
              {getApiErrorMessage(employeesError, 'Failed to load employees')}
            </p>
          )}
          <p className="text-[11px] text-on-surface-variant mt-1">
            Submits employment ID to assigned_employment_id.
          </p>
        </div>
      </div>
    </section>
  )
}
