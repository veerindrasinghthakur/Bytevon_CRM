import type { UseFormRegister } from 'react-hook-form'
import type { EmploymentFormInput } from '../../types'
import { Field, Icon, employeeCreateInputClass as inputClass } from './employee-create-utils'

type Props = {
  register: UseFormRegister<EmploymentFormInput>
}

export function EmployeeCreateBankForm({ register }: Props) {
  return (
    <section className="bv-surface p-6 space-y-4 mb-6">
      <div className="flex items-center gap-2 text-secondary mb-2">
        <Icon name="payments" />
        <h3 className="text-title-lg font-bold text-on-background">Bank</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Account Holder Name">
          <input
            className={inputClass}
            placeholder="Defaults to employee full name"
            {...register('accountHolderName')}
          />
        </Field>
        <Field label="Bank Name">
          <input className={inputClass} {...register('bankName')} />
        </Field>
        <Field label="Account Number">
          <input className={inputClass} {...register('accountNumber')} />
        </Field>
        <Field label="IFSC">
          <input className={inputClass} {...register('ifsc')} />
        </Field>
      </div>
    </section>
  )
}
