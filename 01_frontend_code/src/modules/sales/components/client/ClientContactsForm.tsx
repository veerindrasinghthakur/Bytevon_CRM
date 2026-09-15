import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { ClientFormSchemaInput } from '../../schemas/client/client-form'
import { fieldClass, labelClass } from './client-form-styles'

type Props = {
  form: UseFormReturn<ClientFormSchemaInput>
  contacts: UseFieldArrayReturn<ClientFormSchemaInput, 'contacts'>['fields']
  watchedContacts: ClientFormSchemaInput['contacts']
  editingContactId: string | null
  setEditingContactId: (id: string | null) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

/** Expandable contact-person cards with add/remove. */
export function ClientContactsForm({
  form,
  contacts,
  watchedContacts,
  editingContactId,
  setEditingContactId,
  onAdd,
  onRemove,
}: Props) {
  return (
    <section className="bv-surface p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title-md font-semibold">Contact persons</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
          onClick={onAdd}
        >
          Add contact
        </Button>
      </div>
      <p className="text-body-sm text-on-surface-variant">
        One contact at a time. Click a card to expand and edit; add another for a different project contact.
      </p>

      <div className="space-y-3">
        {contacts.map((c, index) => {
          const open = editingContactId === c.id
          const row = watchedContacts[index]
          const displayName = row?.name ?? ''
          const displayDesig = row?.designation ?? ''
          const displayEmail = row?.email ?? ''
          return (
            <div
              key={c.id}
              className={cn(
                'rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden',
                open && 'ring-2 ring-secondary/30',
              )}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-container-low/50 transition-colors"
                onClick={() => setEditingContactId(open ? null : c.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                    {(displayName || '?')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">
                      {displayName || `Contact ${index + 1}`}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {[displayDesig, displayEmail].filter(Boolean).join(' · ') || 'Click to edit'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">
                  {open ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {open && (
                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-outline-variant pt-4">
                  <div>
                    <label className={labelClass} htmlFor={`contact-name-${c.id}`}>
                      Name <span className="text-error">*</span>
                    </label>
                    <input
                      id={`contact-name-${c.id}`}
                      required
                      {...form.register(`contacts.${index}.name`)}
                      className={fieldClass}
                      placeholder="Sarah Jenkins"
                    />
                    {form.formState.errors.contacts?.[index]?.name && (
                      <p className="text-[11px] text-error mt-1">
                        {form.formState.errors.contacts[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`contact-desig-${c.id}`}>
                      Designation
                    </label>
                    <input
                      id={`contact-desig-${c.id}`}
                      {...form.register(`contacts.${index}.designation`)}
                      className={fieldClass}
                      placeholder="Head of Procurement"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`contact-email-${c.id}`}>
                      Email
                    </label>
                    <input
                      id={`contact-email-${c.id}`}
                      type="email"
                      {...form.register(`contacts.${index}.email`)}
                      className={fieldClass}
                    />
                    {form.formState.errors.contacts?.[index]?.email && (
                      <p className="text-[11px] text-error mt-1">
                        {form.formState.errors.contacts[index]?.email?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`contact-phone-${c.id}`}>
                      Phone
                    </label>
                    <input
                      id={`contact-phone-${c.id}`}
                      {...form.register(`contacts.${index}.phone`)}
                      className={fieldClass}
                    />
                  </div>
                  {contacts.length > 1 && (
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(c.id)}>
                        Remove contact
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
