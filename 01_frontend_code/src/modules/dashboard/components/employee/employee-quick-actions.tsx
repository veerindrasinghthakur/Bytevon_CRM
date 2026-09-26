import type { EmployeeDashboardData } from '../../types/dashboard.types'

export function EmployeeQuickActions({
  quickActions,
  onNavigate,
}: {
  quickActions: EmployeeDashboardData['quickActions']
  onNavigate: (to: string) => void
}) {
  return (
    <section>
      <h3 className="text-title-lg text-on-background mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickActions.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => onNavigate(q.to)}
            className="bv-action-tile group"
          >
            <span className="material-symbols-outlined text-[32px] text-secondary mb-3 bv-action-icon">
              {q.icon}
            </span>
            <span className="text-label-md font-bold text-on-surface">{q.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
