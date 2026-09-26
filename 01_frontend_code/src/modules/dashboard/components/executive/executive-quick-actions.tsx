import type { DashboardQuickAction } from '../../types/dashboard.types'

export function ExecutiveQuickActions({
  quickActions,
  onNavigate,
}: {
  quickActions: DashboardQuickAction[]
  onNavigate: (to: string) => void
}) {
  if (quickActions.length === 0) return null
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {quickActions.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onNavigate(a.to)}
          className="bv-action-tile group"
        >
          <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors duration-200">
            <span className="material-symbols-outlined bv-action-icon">{a.icon}</span>
          </div>
          <span className="text-label-md text-on-surface mt-2">{a.label}</span>
        </button>
      ))}
    </section>
  )
}
