import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { canCreateShift } from '../data/shiftsMock'
import { useWorkforceShiftsList } from '../hooks/use-workforce-shifts'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShiftCard = any

function ShiftQuickContent({ s }: { s: ShiftCard }) {
  return (
    <>
      <QuickSection title="Schedule">
        <QuickStatGrid>
          <QuickStat icon="schedule" value={`${s.startTime}–${s.endTime}`} label="Hours" />
          <QuickStat icon="calendar_month" value={s.days} label="Days" />
          <QuickStat icon="group" value={String(s.employeeCount)} label="Employees" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Details">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="qr_code" label="Code" value={s.code} />
          <QuickMetaTile icon="flag" label="Status" value={s.status} />
        </div>
      </QuickSection>
      <QuickSection title="Identity">
        <QuickRelatedRow icon="badge" label="Name" value={s.name} />
        <QuickRelatedRow icon="tag" label="ID" value={s.id} />
      </QuickSection>
    </>
  )
}

export function ShiftsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    filtered,
    search,
    setSearch,
    status,
    setStatus,
    filtersActive,
    resetFilters,
    isLoading,
    isFetching,
    refetch,
  } = useWorkforceShiftsList()

  const openShiftOverview = (s: ShiftCard) => {
    openPanel({
      title: s.name,
      subtitle: `${s.code} · ${s.startTime} – ${s.endTime}`,
      icon: 'schedule',
      status: s.status,
      statusDotClass: s.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
      content: <ShiftQuickContent s={s} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () =>
        safeNavigate(navigate, {
          to: '/workforce/shifts/$shiftId',
          params: { shiftId: String(s.id) },
        }),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Shifts"
        description="Define work schedules and see who is assigned to each shift."
        actions={
          canCreateShift ? (
            <Button
              variant="primary"
              leftIcon={<Icon name="add" />}
              onClick={() => safeNavigate(navigate, { to: '/workforce/shifts/new' })}
            >
              Add Shift
            </Button>
          ) : undefined
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search shifts by name or code…"
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          placeholder="All statuses"
          options={[
            { value: 'All', label: 'All statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
          minWidthClass="min-w-[140px]"
        />
      </ListToolbar>

      <div className="relative min-h-[120px]">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 bg-surface/70 backdrop-blur-[1px] rounded-xl">
            <TableSkeleton rows={3} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openShiftOverview(s)}
              className="text-left bv-surface card-hover p-5"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-background">{s.name}</h3>
                  <p className="text-label-sm text-on-surface-variant">{s.code}</p>
                </div>
                <span
                  className={cn(
                    'status-badge',
                    s.status === 'Active' ? 'status-success' : 'status-neutral',
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

        {filtered.length === 0 && !isLoading && (
          <div className="bv-surface border-dashed p-12 text-center text-on-surface-variant mt-4">
            No shifts match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
