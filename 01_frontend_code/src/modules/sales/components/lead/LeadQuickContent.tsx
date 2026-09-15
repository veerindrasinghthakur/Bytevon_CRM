import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { cn } from '@/shared/lib/cn'
import type { Lead } from '../../types'
import { stageStyles, priorityStyles } from '../../schemas/enums'

function formatBudget(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

type Props = {
  lead: Lead
}

/** Quick-overview drawer body for a lead row. */
export function LeadQuickContent({ lead }: Props) {
  return (
    <>
      <QuickSection title="Pipeline">
        <QuickStatGrid>
          <QuickStat icon="payments" value={formatBudget(lead.budget)} label="Value" />
          <QuickStat icon="flag" value={lead.stage} label="Stage" />
          <QuickStat icon="priority_high" value={lead.priority} label="Priority" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="source" label="Source" value={lead.source} />
          <QuickMetaTile icon="event" label="Date" value={lead.date ?? '—'} />
          <QuickMetaTile
            icon="sell"
            label="Stage"
            value={
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', stageStyles[lead.stage])}>
                {lead.stage}
              </span>
            }
          />
          <QuickMetaTile
            icon="priority_high"
            label="Priority"
            value={
              <span className={cn('font-bold uppercase text-sm', priorityStyles[lead.priority])}>
                {lead.priority}
              </span>
            }
          />
        </div>
      </QuickSection>
      <QuickSection title="Assignment">
        <div className="space-y-3">
          {lead.assignedTo ? (
            <QuickPersonRow
              initials={lead.assignedTo
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
              roleLabel="Owner"
              name={lead.assignedTo}
            />
          ) : (
            <QuickRelatedRow icon="person_off" label="Owner" value="Unassigned" />
          )}
          {lead.contactTitle && (
            <QuickRelatedRow icon="badge" label="Title" value={lead.contactTitle} />
          )}
        </div>
      </QuickSection>
      <QuickSection title="Related">
        {lead.chatLink && (
          <QuickRelatedRow
            icon="chat"
            label="Chat"
            value={
              <a
                href={lead.chatLink}
                target="_blank"
                rel="noreferrer"
                className="text-secondary font-semibold hover:underline"
              >
                Open conversation
              </a>
            }
          />
        )}
        {lead.notes && <QuickRelatedRow icon="notes" label="Notes" value={lead.notes} />}
        {lead.tags && lead.tags.length > 0 && (
          <QuickRelatedRow icon="label" label="Tags" value={lead.tags.join(', ')} />
        )}
      </QuickSection>
    </>
  )
}
