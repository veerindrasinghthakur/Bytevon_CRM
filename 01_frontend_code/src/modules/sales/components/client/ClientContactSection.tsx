import type { Client } from '../../types'

type Props = {
  client: Client
}

/** Primary contact block. */
export function ClientContactSection({ client }: Props) {
  return (
    <section className="bv-surface p-6">
      <h2 className="text-title-md font-semibold mb-4">Primary contact</h2>
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
    </section>
  )
}
