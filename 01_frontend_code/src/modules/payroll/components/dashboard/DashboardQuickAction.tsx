import { cn } from '@/shared/lib/cn'

export function DashboardQuickAction({
  icon,
  iconTone,
  label,
  onClick,
}: {
  icon: string
  iconTone: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors group card-hover"
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-md transition-colors', iconTone)}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="text-label-sm text-on-background">{label}</span>
      </div>
      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">chevron_right</span>
    </button>
  )
}
