import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import type { ProjectQuickContentProps } from '../../types'

export function ProjectQuickContent({
  clientName,
  progress,
  taskCount,
  teamCount,
  startDate,
  endDate,
}: ProjectQuickContentProps) {
  return (
    <>
      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="calendar_today" label="Start Date" value={startDate ?? '—'} />
          <QuickMetaTile icon="event_available" label="End Date" value={endDate ?? '—'} />
        </div>
      </QuickSection>

      <QuickSection title="Quick Statistics">
        <QuickStatGrid>
          <QuickStat icon="check_circle" value={taskCount ?? 0} label="Tasks" />
          <QuickStat icon="groups" value={teamCount ?? 0} label="Teams" />
          <QuickStat icon="trending_up" value={`${progress ?? 0}%`} label="Progress" />
        </QuickStatGrid>
      </QuickSection>

      <QuickSection title="Related Information">
        <QuickRelatedRow icon="business" label="Client" value={clientName ?? '—'} />
        <QuickRelatedRow icon="percent" label="Progress" value={`${progress ?? 0}%`} />
      </QuickSection>
    </>
  )
}
