import type { UseFormReturn } from 'react-hook-form'
import type { LeadFormSchemaInput } from '../../schemas/lead/lead-form'
import { fieldClass, labelClass } from './lead-form-styles'

type Props = {
  form: UseFormReturn<LeadFormSchemaInput>
}

/** Lead identity section: title, contact, company, email, phone. */
export function LeadIdentityForm({ form }: Props) {
  return (
    <section className="bv-surface p-6 space-y-4">
      <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">badge</span>
        Lead identity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="title">
            Lead title <span className="text-error">*</span>
          </label>
          <input
            id="title"
            required
            {...form.register('title')}
            className={fieldClass}
            placeholder="e.g. TechNexus ERP Migration"
          />
          {form.formState.errors.title && (
            <p className="text-[11px] text-error mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="contactName">
            Contact name <span className="text-error">*</span>
          </label>
          <input
            id="contactName"
            required
            {...form.register('contactName')}
            className={fieldClass}
            placeholder="Sarah Miller"
          />
          {form.formState.errors.contactName && (
            <p className="text-[11px] text-error mt-1">{form.formState.errors.contactName.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="contactTitle">
            Contact title
          </label>
          <input
            id="contactTitle"
            {...form.register('contactTitle')}
            className={fieldClass}
            placeholder="VP of Growth"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="company">
            Company
          </label>
          <input
            id="company"
            {...form.register('company')}
            className={fieldClass}
            placeholder="TechNexus Corp. (optional — client created on WON)"
          />
          <p className="text-[11px] text-on-surface-variant mt-1">
            Optional. On WON, an existing client is reused or a new one is created from this name.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="industry">
            Industry
          </label>
          <input
            id="industry"
            {...form.register('industry')}
            className={fieldClass}
            placeholder="SaaS / Technology"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...form.register('email')}
            className={fieldClass}
            placeholder="s.miller@technexus.com"
          />
          {form.formState.errors.email && (
            <p className="text-[11px] text-error mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            {...form.register('phone')}
            className={fieldClass}
            placeholder="+1 (555) 012-3456"
          />
        </div>
      </div>
    </section>
  )
}
