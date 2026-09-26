import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickPersonRow,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import type { ApprovalQuickContentProps } from '../types/approval-action.types'

export function ApprovalQuickContent({ row }: ApprovalQuickContentProps) {
  return (
    <>
      <QuickSection title="Request">
        <QuickStatGrid>
          <QuickStat icon={row.typeIcon} value={row.type} label="Type" />
          <QuickStat icon="priority_high" value={row.priority} label="Priority" />
          <QuickStat icon="event" value={row.date} label="Date" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Status">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="info" label="Status" value={row.status} />
          {row.stage && <QuickMetaTile icon="account_tree" label="Stage" value={row.stage} />}
        </div>
      </QuickSection>
      <QuickSection title="People">
        <QuickPersonRow initials={row.requesterInitials} roleLabel="Requester" name={row.requester} />
        {row.approver && <QuickRelatedRow icon="how_to_reg" label="Approver" value={row.approver} />}
      </QuickSection>
      <QuickSection title="Identity">
        <QuickRelatedRow icon="tag" label="ID" value={`#${row.id}`} />
      </QuickSection>
    </>
  )
}
