import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useShiftsList } from '../../hooks/use-organization-shifts'
import { can } from '@/shared/rbac/can'
import { Action, ResourceName } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShiftRow = any

function ShiftQuickContent({ s }: { s: ShiftRow }) {
  return (
    <>
      <QuickSection title="Schedule">
        <QuickStatGrid>
          <QuickStat
            icon="schedule"
            value={`${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)}`}
            label="Hours"
          />
          <QuickStat icon="timer" value={`${s.grace_late_minutes ?? 0}m`} label="Grace" />
          <QuickStat
            icon="coffee"
            value={s.break_duration_minutes != null ? `${s.break_duration_minutes}m` : '—'}
            label="Break"
          />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Flags">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="nights_stay" label="Overnight" value={s.is_overnight ? 'Yes' : 'No'} />
          <QuickMetaTile icon="more_time" label="Flexible end" value={s.flexible_end ? 'Yes' : 'No'} />
        </div>
      </QuickSection>
      <QuickSection title="Identity">
        <QuickRelatedRow icon="badge" label="Name" value={s.name} />
        <QuickRelatedRow icon="tag" label="ID" value={String(s.id)} />
      </QuickSection>
    </>
  )
}

export function ShiftsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const base = pathname.startsWith('/workforce') ? '/workforce/shifts' : '/admin/settings/shifts'
  const canCreate = can({ action: Action.CREATE, resource: ResourceName.SHIFT })

  const { data, isLoading, isError, error, refetch } = useShiftsList(true)
  const items = data?.items ?? []

  const openShiftOverview = (s: ShiftRow) => {
    openPanel({
      title: s.name,
      subtitle: `${String(s.start_time).slice(0, 5)} – ${String(s.end_time).slice(0, 5)}`,
      icon: 'schedule',
      status: s.is_archived ? 'Archived' : 'Active',
      statusDotClass: s.is_archived ? 'bg-slate-400' : 'bg-emerald-500',
      content: <ShiftQuickContent s={s} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () =>
        safeNavigate(navigate, {
          to: `${base}/$shiftId`,
          params: { shiftId: String(s.id) },
        }),
      widthClass: 'max-w-[520px]',
    })
  }

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Shifts</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Working shift templates used on employment assignments
          </p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() => safeNavigate(navigate, { to: `${base}/new` })}
          >
            Add shift
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState title="No shifts" description="Create a shift to assign employees.">
          {canCreate ? (
            <Button variant="primary" onClick={() => safeNavigate(navigate, { to: `${base}/new` })}>
              Add shift
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openShiftOverview(s)}
              className="text-left bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-title-md font-semibold text-on-background">{s.name}</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}
                    {s.is_overnight ? ' · Overnight' : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                    s.is_archived
                      ? 'bg-surface-container text-on-surface-variant'
                      : 'bg-secondary/15 text-secondary',
                  )}
                >
                  {s.is_archived ? 'ARCHIVED' : 'ACTIVE'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-body-sm">
                <div>
                  <p className="text-label-sm text-on-surface-variant">Grace</p>
                  <p className="font-medium">{s.grace_late_minutes} min</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Break</p>
                  <p className="font-medium">{s.break_duration_minutes ?? '—'} min</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Flexible end</p>
                  <p className="font-medium">{s.flexible_end ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
