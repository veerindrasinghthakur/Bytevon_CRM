import { MetricCard } from '@/shared/components/ui/MetricCard'

type Props = {
  total: number
  active: number
  archived: number
  departments?: number
  positions?: number
}

export function EmployeeStatsCards({ total, active, archived, departments, positions }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <MetricCard label="Total" value={total} icon="groups" />
      <MetricCard label="Active" value={active} icon="check_circle" valueClassName="text-secondary" />
      <MetricCard label="Archived" value={archived} icon="archive" />
      <MetricCard label="Departments" value={departments ?? '—'} icon="domain" />
      <MetricCard label="Positions" value={positions ?? '—'} icon="work" />
    </div>
  )
}
