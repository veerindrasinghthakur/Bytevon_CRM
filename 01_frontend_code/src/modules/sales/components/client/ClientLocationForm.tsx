import type { UseFormReturn } from 'react-hook-form'
import { cn } from '@/shared/lib/cn'
import type { ClientFormSchemaInput } from '../../schemas/client/client-form'
import { fieldClass, labelClass } from './client-form-styles'

type Props = {
  form: UseFormReturn<ClientFormSchemaInput>
}

/** Country / state / city / address. */
export function ClientLocationForm({ form }: Props) {
  return (
    <section className="bv-surface p-6 space-y-4">
      <h2 className="text-title-md font-semibold">Location</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="country">
            Country
          </label>
          <input id="country" {...form.register('country')} className={fieldClass} placeholder="United States" />
        </div>
        <div>
          <label className={labelClass} htmlFor="state">
            State / Province
          </label>
          <input id="state" {...form.register('state')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="city">
            City
          </label>
          <input id="city" {...form.register('city')} className={fieldClass} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            {...form.register('address')}
            className={cn(fieldClass, 'resize-y')}
            placeholder="Street, building, postal code…"
          />
        </div>
      </div>
    </section>
  )
}
