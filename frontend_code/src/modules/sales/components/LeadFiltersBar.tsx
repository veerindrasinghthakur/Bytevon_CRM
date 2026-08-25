import { Select } from '@/shared/components/ui/Select'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden="true">
      {name}
    </span>
  )
}

export interface LeadFiltersBarProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  stageFilter: string
  onStageChange: (v: string) => void
  priorityFilter: string
  onPriorityChange: (v: string) => void
  sourceFilter: string
  onSourceChange: (v: string) => void
  /** Loaded from GET /sales/leads/filter-options */
  statuses: string[]
  stages: string[]
  priorities: string[]
  sources: string[]
  onReset: () => void
}

export function LeadFiltersBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  stageFilter,
  onStageChange,
  priorityFilter,
  onPriorityChange,
  sourceFilter,
  onSourceChange,
  statuses,
  stages,
  priorities,
  sources,
  onReset,
}: LeadFiltersBarProps) {
  return (
    <div className="flex flex-nowrap items-center gap-2 bg-surface-container-low p-3 rounded-xl border border-outline-variant overflow-x-auto">
      <div className="relative flex-1 min-w-[10rem] max-w-[16rem]">
        <Icon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg"
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
          placeholder="Search by name or ID..."
        />
      </div>
      <Select
        value={statusFilter}
        onChange={onStatusChange}
        placeholder="All Status"
        options={[
          { value: 'All', label: 'All Status' },
          ...statuses.map((s) => ({ value: s, label: s })),
        ]}
        minWidthClass="min-w-[7rem] max-w-[10rem]"
      />
      <Select
        value={stageFilter}
        onChange={onStageChange}
        placeholder="All Stages"
        options={[{ value: 'All', label: 'All Stages' }, ...stages.map((s) => ({ value: s, label: s }))]}
        minWidthClass="min-w-[7rem] max-w-[10rem]"
      />
      <Select
        value={priorityFilter}
        onChange={onPriorityChange}
        placeholder="All Priority"
        options={[
          { value: 'All', label: 'All Priority' },
          ...priorities.map((p) => ({ value: p, label: p })),
        ]}
        minWidthClass="min-w-[7rem] max-w-[10rem]"
      />
      <Select
        value={sourceFilter}
        onChange={onSourceChange}
        placeholder="All Sources"
        options={[
          { value: 'All', label: 'All Sources' },
          ...sources.map((s) => ({ value: s, label: s })),
        ]}
        minWidthClass="min-w-[7rem] max-w-[10rem]"
      />
      <button
        type="button"
        className="p-2 text-secondary border border-outline-variant rounded-lg hover:bg-secondary/5 shrink-0"
        onClick={onReset}
        aria-label="Reset filters"
      >
        <Icon name="restart_alt" className="text-lg" />
      </button>
    </div>
  )
}
