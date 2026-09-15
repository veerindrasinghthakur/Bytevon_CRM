import type { UseFormReturn } from 'react-hook-form'
import type { EmployeeDetailEditInput } from '../../schemas/employment-form'
import { Icon, employeeDetailInputClass } from './employee-detail-utils'

type Props = {
  form: UseFormReturn<EmployeeDetailEditInput>
}

export function EmployeeEditForm({ form }: Props) {
  return (
    <div className="bv-surface border-secondary/30 p-6 space-y-4">
      <h3 className="text-title-lg font-semibold flex items-center gap-2">
        <Icon name="edit" className="text-secondary" /> Edit profile
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-label-sm text-on-surface-variant" htmlFor="emp-first">
            First name
          </label>
          <input id="emp-first" className={employeeDetailInputClass} {...form.register('firstName')} />
          {form.formState.errors.firstName && (
            <p className="text-xs text-error mt-1">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant" htmlFor="emp-last">
            Last name
          </label>
          <input id="emp-last" className={employeeDetailInputClass} {...form.register('lastName')} />
          {form.formState.errors.lastName && (
            <p className="text-xs text-error mt-1">{form.formState.errors.lastName.message}</p>
          )}
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant" htmlFor="emp-dob">
            Date of birth
          </label>
          <input
            id="emp-dob"
            className={employeeDetailInputClass}
            type="date"
            {...form.register('dateOfBirth')}
          />
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant" htmlFor="emp-email">
            Personal email
          </label>
          <input
            id="emp-email"
            className={employeeDetailInputClass}
            type="email"
            {...form.register('personalEmail')}
          />
          {form.formState.errors.personalEmail && (
            <p className="text-xs text-error mt-1">{form.formState.errors.personalEmail.message}</p>
          )}
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant" htmlFor="emp-phone">
            Phone
          </label>
          <input id="emp-phone" className={employeeDetailInputClass} {...form.register('personalPhone')} />
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant" htmlFor="emp-addr">
            Address
          </label>
          <input id="emp-addr" className={employeeDetailInputClass} {...form.register('address')} />
        </div>
      </div>
    </div>
  )
}
