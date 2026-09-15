import type { Lead } from '../../types'

type Props = {
  lead: Lead
}

/** Contact & company definition list. */
export function LeadContactSection({ lead }: Props) {
  return (
    <section className="bv-surface p-6">
      <h2 className="text-title-md font-semibold mb-4">Contact & company</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Contact</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.contactName}</dd>
          {lead.contactTitle && (
            <dd className="text-xs text-on-surface-variant">{lead.contactTitle}</dd>
          )}
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Company</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.company}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Industry</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.industry ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Source</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.source}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Email</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Phone</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.phone ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Assigned</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.assignedTo ?? 'Unassigned'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Created</dt>
          <dd className="font-semibold text-on-surface mt-0.5">{lead.createdAt}</dd>
        </div>
      </dl>
    </section>
  )
}
