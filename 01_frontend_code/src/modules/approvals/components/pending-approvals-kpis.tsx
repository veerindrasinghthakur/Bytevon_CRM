import { MetricCard } from '@/shared/components/ui/MetricCard'
import type { ApprovalKpis } from '../types/request.types'

export function PendingApprovalsKpis({ kpis }: { kpis: ApprovalKpis }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard icon="pending_actions" label="Pending" value={String(kpis.pending)} />
      <MetricCard
        icon="check_circle"
        label="Approved Today"
        value={String(kpis.approvedToday)}
        hint="Today"
        valueClassName="text-secondary"
      />
      <MetricCard
        icon="cancel"
        label="Rejected Today"
        value={String(kpis.rejectedToday)}
        hint="Today"
        valueClassName="text-error"
      />
      <MetricCard
        icon="priority_high"
        label="Action Required"
        value={String(kpis.overdue).padStart(2, '0')}
        className="bg-secondary text-on-secondary border-secondary"
      />
    </section>
  )
}
