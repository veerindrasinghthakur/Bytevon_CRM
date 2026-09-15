import type { UseFormReturn } from 'react-hook-form'
import { cn } from '@/shared/lib/cn'
import type { LeadFormSchemaInput } from '../../schemas/lead/lead-form'
import { fieldClass } from './lead-form-styles'

type Props = {
  form: UseFormReturn<LeadFormSchemaInput>
}

/** Background notes textarea. */
export function LeadNotesForm({ form }: Props) {
  return (
    <section className="bv-surface p-6 space-y-4">
      <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">notes</span>
        Background & context
      </h2>
      <textarea
        id="notes"
        rows={5}
        {...form.register('notes')}
        className={cn(fieldClass, 'resize-y')}
        placeholder="Discovery notes, internal context, next steps..."
        aria-label="Notes"
      />
    </section>
  )
}
