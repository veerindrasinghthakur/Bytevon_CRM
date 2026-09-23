import type { Client } from '../../types'
import type { ClientContactInput } from '../../api/client'

type Props = {
  client: Client
  contacts?: ClientContactInput[]
  isLoading?: boolean
}

/** Contact persons block — live contact list with primary fallback. */
export function ClientContactSection({ client, contacts = [], isLoading }: Props) {
  const primary = contacts[0]
  return (
    <section className="bv-surface p-6">
      <h2 className="text-title-md font-semibold mb-4">
        {contacts.length > 1 ? `Contact persons (${contacts.length})` : 'Primary contact'}
      </h2>
      {isLoading ? (
        <p className="text-body-sm text-on-surface-variant">Loading contacts…</p>
      ) : contacts.length > 0 ? (
        <div className="space-y-4">
          {contacts.map((c, i) => (
            <dl
              key={`${c.name}-${i}`}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-outline-variant/40 pb-4 last:border-0 last:pb-0"
            >
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Name</dt>
                <dd className="font-semibold text-on-surface mt-0.5">
                  {c.name}
                  {i === 0 && (
                    <span className="ml-2 text-[10px] font-bold uppercase text-secondary">Primary</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Designation</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{c.designation ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Email</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{c.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Phone</dt>
                <dd className="font-semibold text-on-surface mt-0.5">{c.phone ?? '—'}</dd>
              </div>
            </dl>
          ))}
        </div>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Name</dt>
            <dd className="font-semibold text-on-surface mt-0.5">{client.primaryContact ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Email</dt>
            <dd className="font-semibold text-on-surface mt-0.5">{client.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Phone</dt>
            <dd className="font-semibold text-on-surface mt-0.5">{client.phone ?? '—'}</dd>
          </div>
        </dl>
      )}
      {primary == null && contacts.length === 0 && (
        <p className="text-body-sm text-on-surface-variant mt-3">
          No contact persons saved yet — add them from Edit client.
        </p>
      )}
    </section>
  )
}
