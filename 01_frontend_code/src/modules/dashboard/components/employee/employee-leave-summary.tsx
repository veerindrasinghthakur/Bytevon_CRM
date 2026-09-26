import type { EmployeeDashboardData } from '../../types/dashboard.types'

const card = 'bv-surface card-hover'

export function EmployeeLeaveSummary({
  leaveSummary,
}: {
  leaveSummary: EmployeeDashboardData['leaveSummary']
}) {
  return (
    <div className={`${card} p-6 flex flex-col gap-4`}>
      <h3 className="text-title-lg text-on-background">Leave Summary</h3>
      {leaveSummary.map((l) => (
        <div
          key={l.name}
          className={`bg-surface-container-low p-4 rounded-lg flex items-center justify-between border-l-4 ${l.border}`}
        >
          <div>
            <span className="text-label-md font-bold text-on-surface">{l.name}</span>
            <p className="text-label-sm text-on-surface-variant">{l.used}</p>
          </div>
          <div className="text-right">
            <span className={`text-body-lg font-bold ${l.color}`}>{l.left}</span>
            <p className="text-label-sm text-on-surface-variant">left</p>
          </div>
        </div>
      ))}
    </div>
  )
}
