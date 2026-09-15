import type { UseFormReturn } from 'react-hook-form'
import { Select } from '@/shared/components/ui/Select'
import type { ClientFormSchemaInput } from '../../schemas/client/client-form'
import { ClientTypeOptions, RecordStatusOptions } from '../../schemas/enums'
import { fieldClass, labelClass } from './client-form-styles'

type Props = {
  form: UseFormReturn<ClientFormSchemaInput>
}

/** Account identity: name, legal name, type, status, industry, website, tax, founded. */
export function ClientAccountForm({ form }: Props) {
  return (
    <section className="bv-surface p-6 space-y-4">
      <h2 className="text-title-md font-semibold">Account</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="name">
            Client name <span className="text-error">*</span>
          </label>
          <input
            id="name"
            required
            {...form.register('name')}
            className={fieldClass}
            placeholder="Nexus Global Holdings"
          />
          {form.formState.errors.name && (
            <p className="text-[11px] text-error mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="legalName">
            Legal name
          </label>
          <input
            id="legalName"
            {...form.register('legalName')}
            className={fieldClass}
            placeholder="Nexus Global Holdings, Inc."
          />
        </div>
        <Select
          label="Type"
          value={form.watch('type')}
          onChange={(v) => form.setValue('type', v as ClientFormSchemaInput['type'])}
          options={ClientTypeOptions}
          minWidthClass="w-full"
        />
        <Select
          label="Status"
          value={form.watch('status')}
          onChange={(v) => form.setValue('status', v as ClientFormSchemaInput['status'])}
          options={RecordStatusOptions}
          minWidthClass="w-full"
        />
        <div>
          <label className={labelClass} htmlFor="industry">
            Industry
          </label>
          <input id="industry" {...form.register('industry')} className={fieldClass} placeholder="Technology" />
        </div>
        <div>
          <label className={labelClass} htmlFor="website">
            Website
          </label>
          <input id="website" {...form.register('website')} className={fieldClass} placeholder="nexusglobal.com" />
        </div>
        <div>
          <label className={labelClass} htmlFor="taxId">
            Tax ID
          </label>
          <input id="taxId" {...form.register('taxId')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="founded">
            Founding date
          </label>
          <input id="founded" type="date" {...form.register('founded')} className={fieldClass} />
        </div>
      </div>
    </section>
  )
}
