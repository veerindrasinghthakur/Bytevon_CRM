import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import type { AppNotification } from '../../types'

export function NotificationQuickContent({ n }: { n: AppNotification }) {
  return (
    <>
      <QuickSection title="Summary">
        <QuickStatGrid>
          <QuickStat icon="category" value={n.module} label="Module" />
          <QuickStat icon="priority_high" value={n.priority} label="Priority" />
          <QuickStat icon="schedule" value={n.timeAgo} label="When" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Message">
        <p className="text-body-sm text-on-surface-variant leading-relaxed">{n.body}</p>
      </QuickSection>
      {n.actor && (
        <QuickSection title="Actor">
          <QuickPersonRow
            initials={n.actor
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
            roleLabel="From"
            name={n.actor}
          />
        </QuickSection>
      )}
      {n.meta && n.meta.length > 0 && (
        <QuickSection title="Meta">
          <div className="grid grid-cols-2 gap-3">
            {n.meta.map((m) => (
              <QuickMetaTile key={m.label} icon="info" label={m.label} value={m.value} />
            ))}
          </div>
        </QuickSection>
      )}
      {n.note && (
        <QuickSection title="Note">
          <QuickRelatedRow icon="sticky_note_2" label="Note" value={n.note} />
        </QuickSection>
      )}
    </>
  )
}
