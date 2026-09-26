import { KpiCard } from '@/shared/components/ui/KpiCard'
import type { ApprovalKpis } from '../types/request.types'

export function ApprovalCenterKpis({
  kpis,
  onPendingClick,
}: {
  kpis: ApprovalKpis
  onPendingClick: () => void
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon="stacks"
        iconClass="bg-secondary/5 text-secondary"
        label="Total Approvals"
        value={kpis.total}
        trend="Stable"
      />
      <KpiCard
        icon="pending_actions"
        iconClass="bg-secondary/15 text-secondary"
        label="Pending Approvals"
        value={kpis.pending}
        trend="12%"
        trendUp
        onClick={onPendingClick}
      />
      <KpiCard
        icon="task_alt"
        iconClass="bg-secondary/15 text-secondary"
        label="Approved Today"
        value={kpis.approvedToday}
        trend="8%"
        trendUp
        trendClass="text-secondary"
      />
      <KpiCard
        icon="cancel"
        iconClass="bg-error/10 text-error"
        label="Rejected Today"
        value={kpis.rejectedToday}
        trend="Stable"
      />
    </section>
  )
}
