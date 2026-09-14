import type { ProjectDetailTab } from '../../types'
import { PROJECT_DETAIL_TABS } from './project-detail-helpers'
import { cn } from '@/shared/lib/cn'

type Props = {
  tab: ProjectDetailTab
  taskCount?: number | null
  onSelect: (tab: ProjectDetailTab) => void
}

export function ProjectDetailTabNav({ tab, taskCount, onSelect }: Props) {
  return (
    <div className="border-b border-outline-variant">
      <nav className="flex flex-wrap gap-1 -mb-px">
        {PROJECT_DETAIL_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              'px-4 py-3 text-sm font-semibold border-b-2 transition-colors',
              tab === t.id
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface',
            )}
          >
            {t.label}
            {t.id === 'tasks' && (taskCount ?? 0) > 0 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                {taskCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
