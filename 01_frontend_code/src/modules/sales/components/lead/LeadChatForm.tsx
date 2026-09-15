import type { UseFormReturn } from 'react-hook-form'
import type { LeadFormSchemaInput } from '../../schemas/lead/lead-form'
import { fieldClass, labelClass } from './lead-form-styles'

type Props = {
  form: UseFormReturn<LeadFormSchemaInput>
}

/** Optional chat link (UI-only field). */
export function LeadChatForm({ form }: Props) {
  return (
    <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 space-y-4 executive-shadow">
      <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">chat</span>
        Chat with client
      </h2>
      <div>
        <label className={labelClass} htmlFor="chatLink">
          Chat link
        </label>
        <input
          id="chatLink"
          type="url"
          {...form.register('chatLink')}
          className={fieldClass}
          placeholder="https://chat.bytevon.app/c/..."
        />
        <p className="text-[11px] text-on-surface-variant mt-1">UI-only — not stored on leads table.</p>
      </div>
    </section>
  )
}
