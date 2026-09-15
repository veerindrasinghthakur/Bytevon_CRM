import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { cn } from '@/shared/lib/cn'
import type { Client } from '../../types'
import { typeStyles } from '../../schemas/enums'

function formatMoney(n?: number) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

type Props = {
  client: Client
}

/** Quick-overview drawer body for a client row. */
export function ClientQuickContent({ client }: Props) {
  return (
    <>
      <QuickSection title="Quick Statistics">
        <QuickStatGrid>
          <QuickStat icon="folder_open" value={client.projects} label="Projects" />
          <QuickStat icon="person_search" value={client.leads} label="Leads" />
          <QuickStat icon="payments" value={formatMoney(client.arr ?? client.revenue)} label="ARR" />
        </QuickStatGrid>
      </QuickSection>

      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile
            icon="category"
            label="Type"
            value={
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', typeStyles[client.type])}>
                {client.type}
              </span>
            }
          />
          <QuickMetaTile icon="factory" label="Industry" value={client.industry} />
          <QuickMetaTile icon="public" label="Country" value={client.country} />
          <QuickMetaTile icon="payments" label="Revenue" value={formatMoney(client.arr ?? client.revenue)} />
        </div>
      </QuickSection>

      <QuickSection title="Related Information">
        <QuickRelatedRow icon="business" label="Client" value={client.name} />
        <QuickRelatedRow icon="sell" label="Type" value={client.type} />
        {client.chatLink && (
          <QuickRelatedRow
            icon="chat"
            label="Chat"
            value={
              <a
                href={client.chatLink}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-semibold hover:underline"
              >
                Open conversation
              </a>
            }
          />
        )}
      </QuickSection>
    </>
  )
}
