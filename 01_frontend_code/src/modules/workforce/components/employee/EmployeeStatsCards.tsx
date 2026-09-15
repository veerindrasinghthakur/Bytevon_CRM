import { MetricCard } from '@/shared/components/ui/MetricCard'

type Props = {
  total: number
  active: number
  archived: number
}

export function EmployeeStatsCards({ total, active, archived }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl ml-auto">
      <MetricCard label="Total" value={total} icon="groups" />
      <MetricCard label="Active" value={active} icon="check_circle" valueClassName="text-secondary" />
      <MetricCard label="Archived" value={archived} icon="archive" />
    </div>
  )
}
