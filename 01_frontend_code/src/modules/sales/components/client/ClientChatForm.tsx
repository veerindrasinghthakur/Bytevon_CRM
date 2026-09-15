import type { UseFormReturn } from 'react-hook-form'
import type { ClientFormSchemaInput } from '../../schemas/client/client-form'
import { fieldClass } from './client-form-styles'

type Props = {
  form: UseFormReturn<ClientFormSchemaInput>
}

/** Optional chat link section. */
export function ClientChatForm({ form }: Props) {
  return (
    <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 space-y-4 executive-shadow">
      <h2 className="text-title-md font-semibold flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">chat</span>
        Chat with client
      </h2>
      <input
        id="chatLink"
        type="url"
        {...form.register('chatLink')}
        className={fieldClass}
        placeholder="https://chat.bytevon.app/c/..."
        aria-label="Chat link"
      />
    </section>
  )
}
