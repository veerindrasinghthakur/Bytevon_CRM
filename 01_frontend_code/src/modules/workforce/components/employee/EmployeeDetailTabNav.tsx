import { cn } from '@/shared/lib/cn'
import type { EmployeeDetailTab } from './employee-detail-utils'

const TABS: { id: EmployeeDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'State & assignments' },
  { id: 'salary', label: 'Salary' },
  { id: 'documents', label: 'Documents' },
]

type Props = {
  tab: EmployeeDetailTab
  onTabChange: (tab: EmployeeDetailTab) => void
}

export function EmployeeDetailTabNav({ tab, onTabChange }: Props) {
  return (
    <div className="bv-surface rounded-b-none flex overflow-x-auto border-b-0">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={cn(
            'px-6 py-4 text-label-md whitespace-nowrap border-b-2 transition-colors cursor-pointer',
            tab === id
              ? 'border-secondary text-secondary font-semibold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
