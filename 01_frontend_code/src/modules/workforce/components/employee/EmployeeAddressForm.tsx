import type { UseFormRegister } from 'react-hook-form'
import type { EmploymentFormInput } from '../../types'
import { Field, Icon, employeeCreateInputClass as inputClass } from './employee-create-utils'

type Props = {
  register: UseFormRegister<EmploymentFormInput>
}

export function EmployeeAddressForm({ register }: Props) {
  return (
    <section className="bv-surface p-6 space-y-4 mb-6">
      <div className="flex items-center gap-2 text-secondary mb-2">
        <Icon name="home" />
        <h3 className="text-title-lg font-bold text-on-background">Address</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Street">
          <input className={inputClass} {...register('street')} />
        </Field>
        <Field label="City">
          <input className={inputClass} {...register('city')} />
        </Field>
        <Field label="State / Region">
          <input className={inputClass} {...register('stateRegion')} />
        </Field>
        <Field label="ZIP / Postal">
          <input className={inputClass} {...register('zip')} />
        </Field>
        <Field label="Country">
          <input className={inputClass} {...register('country')} />
        </Field>
      </div>
    </section>
  )
}
