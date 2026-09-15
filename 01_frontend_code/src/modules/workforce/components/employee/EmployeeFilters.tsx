import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

type Props = {
  search: string
  onSearchChange: (v: string) => void
  deptFilter: string
  onDeptChange: (v: string) => void
  stateFilter: string
  onStateChange: (v: string) => void
  typeFilter: string
  onTypeChange: (v: string) => void
  departments: { name: string }[]
  states: string[]
  types: string[]
  filtersActive: boolean
  onResetFilters: () => void
}

export function EmployeeFilters({
  search,
  onSearchChange,
  deptFilter,
  onDeptChange,
  stateFilter,
  onStateChange,
  typeFilter,
  onTypeChange,
  departments,
  states,
  types,
  filtersActive,
  onResetFilters,
}: Props) {
  return (
    <div className="bv-surface p-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Icon
          name="person_search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg"
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
          placeholder="Search by Name, Code, Email, or Department..."
        />
      </div>
      <Select
        value={deptFilter}
        onChange={onDeptChange}
        placeholder="All Departments"
        options={[
          { value: 'all', label: 'All Departments' },
          ...departments.map((d) => ({ value: d.name, label: d.name })),
        ]}
      />
      <Select
        value={stateFilter}
        onChange={onStateChange}
        placeholder="All Statuses"
        options={[
          { value: 'all', label: 'All Statuses' },
          ...states.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
        ]}
      />
      <Select
        value={typeFilter}
        onChange={onTypeChange}
        placeholder="All Types"
        options={[
          { value: 'all', label: 'All Types' },
          ...types.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
        ]}
      />
      {filtersActive && (
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          Clear
        </Button>
      )}
    </div>
  )
}
