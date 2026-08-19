import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { canCreateShift, shifts } from '../data/shiftsMock'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function ShiftsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | 'Active' | 'Inactive'>('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return shifts.filter((s) => {
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.days.toLowerCase().includes(q)
      const matchStatus = status === 'All' || s.status === status
      return matchQ && matchStatus
    })
  }, [search, status])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts"
        description="Define work schedules and see who is assigned to each shift."
        actions={
          canCreateShift ? (
            <Button
              variant="primary"
              leftIcon={<Icon name="add" />}
              onClick={() => navigate({ to: '/workforce/shifts/new' })}
            >
              Add Shift
            </Button>
          ) : undefined
        }
      />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            placeholder="Search shifts by name or code…"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'All' | 'Active' | 'Inactive')}
          className="border border-outline-variant rounded-lg px-3 py-2 text-label-md bg-surface-container-lowest"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => navigate({ to: '/workforce/shifts/$shiftId', params: { shiftId: s.id } })}
            className="text-left bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm hover:border-secondary transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-title-lg font-semibold text-on-background">{s.name}</h3>
                <p className="text-label-sm text-on-surface-variant">{s.code}</p>
              </div>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-label-sm font-bold',
                  s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
                )}
              >
                {s.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
              <Icon name="schedule" className="text-lg text-secondary" />
              {s.startTime} – {s.endTime}
            </div>
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
              <Icon name="calendar_month" className="text-lg text-secondary" />
              {s.days}
            </div>
            <div className="flex items-center gap-2 text-body-sm font-medium text-on-background">
              <Icon name="group" className="text-lg text-secondary" />
              {s.employeeCount} employees
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-outline-variant p-12 text-center text-on-surface-variant">
          No shifts match your filters.
        </div>
      )}
    </div>
  )
}
