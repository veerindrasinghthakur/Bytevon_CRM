import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { cn } from '@/shared/lib/cn'

export function CenterFilterBar({
  tabs,
  tab,
  setTab,
  query,
  setQuery,
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  moduleFilter,
  setModuleFilter,
  modules,
  filtersActive,
  resetFilters,
}: {
  tabs: { id: string; label: string }[]
  tab: string
  setTab: (id: string) => void
  query: string
  setQuery: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  priorityFilter: string
  setPriorityFilter: (v: string) => void
  moduleFilter: string
  setModuleFilter: (v: string) => void
  modules: string[]
  filtersActive: boolean
  resetFilters: () => void
}) {
  return (
    <section className="bv-surface p-2">
      <div className="flex items-center gap-1 border-b border-outline-variant px-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-5 py-3 text-label-md whitespace-nowrap transition-colors border-b-2',
              tab === t.id
                ? 'border-secondary text-secondary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-background',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3 px-3 py-3">
        <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant px-3 h-11 flex-1 min-w-[160px] max-w-xs">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            className="bg-transparent border-none text-body-sm w-full outline-none"
            placeholder="Filter notifications..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          minWidthClass="min-w-[130px]"
          options={[
            { value: 'All', label: 'Type: All' },
            { value: 'System', label: 'System' },
            { value: 'Approval', label: 'Approval' },
            { value: 'Mention', label: 'Mention' },
          ]}
        />
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          minWidthClass="min-w-[130px]"
          options={[
            { value: 'All', label: 'Priority: All' },
            { value: 'High', label: 'High' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Low', label: 'Low' },
          ]}
        />
        <Select
          value={moduleFilter}
          onChange={setModuleFilter}
          minWidthClass="min-w-[130px]"
          options={[
            { value: 'All', label: 'Module: All' },
            ...modules.map((m) => ({ value: m, label: m })),
          ]}
        />
        {filtersActive && (
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        )}
      </div>
    </section>
  )
}
