import type { Client } from '../../types'

type Props = {
  client: Client
}

/** Account overview definition list. */
export function ClientOverviewSection({ client }: Props) {
  return (
    <section className="bv-surface p-6">
      <h2 className="text-title-md font-semibold mb-4">Account overview</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Legal name</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{client.legalName ?? client.name}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Industry</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{client.industry ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Sector</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{client.sector ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Country</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{client.country ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Website</dt>
          <dd className="font-semibold text-on-surface mt-0.5">
            {client.website ? (
              <a
                href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-secondary hover:underline"
              >
                {client.website}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Client since</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{client.clientSince ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Tax ID</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{client.taxId ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Founded</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{client.founded ?? '—'}</dd>
        </div>
        {client.address && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Address</dt>
            <dd className="font-semibold text-on-surface mt-0.5">{client.address}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
