import { useMemo } from 'react'
import { cn } from '@/shared/lib/cn'
import { ActivityFeed } from '@/shared/components/ui/ActivityFeed'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { CALENDAR_DAY_LABELS, buildMonthGrid } from '../../lib/dashboard-calendar'
import { useExecutiveDecision } from '../../hooks/use-executive-decision'
import type {
  DashboardSectionId,
  ExecutiveDashboardData,
} from '../../types/dashboard.types'

const card = 'bv-surface card-hover'

export function ExecutiveBottomRow({
  pending,
  activities,
  sections,
  canApprove,
  onNavigate,
}: {
  pending: ExecutiveDashboardData['pending']
  activities: ExecutiveDashboardData['activities']
  sections: Record<DashboardSectionId, boolean>
  canApprove: boolean
  onNavigate: (to: string) => void
}) {
  // Live calendar: current month grid, today highlighted. Deadlines below come
  // from live pending approvals — never hardcoded events.
  const calendarCells = useMemo(() => buildMonthGrid(new Date()), [])
  const upcomingDeadlines = useMemo(() => pending.slice(0, 2), [pending])
  const decideMut = useExecutiveDecision()

  const visibleCount = [sections.pending_approvals, sections.activity_feed, sections.calendar].filter(
    Boolean,
  ).length
  if (visibleCount === 0) return null

  return (
    <section
      className={cn(
        'grid gap-6',
        visibleCount >= 3
          ? 'grid-cols-1 lg:grid-cols-3'
          : visibleCount === 2
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1',
      )}
    >
      {sections.pending_approvals && (
        <div className={`${card} p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold text-on-background">Pending approvals</h3>
            <span className="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {pending.length} New
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-secondary bv-row-hover cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                  {p.initials}
                </div>
                <div className="flex-1">
                  <p className="text-label-md text-on-surface leading-tight">{p.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{p.detail}</p>
                </div>
                {canApprove && p.id != null && (
                  <div className="flex gap-1">
                    <Can action={Action.APPROVE} resource={'approval'}>
                      <button
                        type="button"
                        disabled={decideMut.isPending}
                        onClick={() => decideMut.mutate({ id: p.id, decision: 'approve' })}
                        className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center bv-pressable cursor-pointer disabled:opacity-50"
                        aria-label="Approve"
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      </button>
                      <button
                        type="button"
                        disabled={decideMut.isPending}
                        onClick={() => decideMut.mutate({ id: p.id, decision: 'reject' })}
                        className="w-8 h-8 rounded-full border border-outline text-on-surface-variant flex items-center justify-center hover:bg-error hover:text-white hover:border-error transition-colors duration-200 cursor-pointer disabled:opacity-50"
                        aria-label="Reject"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </Can>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Can action={Action.VIEW} resource={'approval'}>
            <button
              type="button"
              onClick={() => onNavigate('/approvals/pending')}
              className="mt-3 text-secondary text-label-md hover:underline w-full text-center py-2 transition-colors duration-200 cursor-pointer"
            >
              View all requests
            </button>
          </Can>
        </div>
      )}

      {sections.activity_feed && (
        <ActivityFeed
          className={`${card} p-6`}
          framed={false}
          title="Recent activities"
          variant="standard"
          items={activities.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            timestamp: a.timestamp,
            icon: a.icon,
            badge: a.badge,
          }))}
          headerAction={
            <button
              type="button"
              className="text-label-sm text-secondary hover:underline cursor-pointer"
              onClick={() => onNavigate('/approvals/pending')}
            >
              View all
            </button>
          }
        />
      )}

      {sections.calendar && (
        <div className={`${card} p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold text-on-background">Calendar</h3>
            <button
              type="button"
              className="text-secondary material-symbols-outlined bv-icon-btn rounded-full p-1"
            >
              chevron_right
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-label-sm text-on-surface-variant mb-2">
            {CALENDAR_DAY_LABELS.map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-label-md mb-6">
            {calendarCells.map((c) =>
              c.day === null ? (
                <span key={c.key} />
              ) : (
                <span
                  key={c.key}
                  className={cn(
                    'py-2 rounded-lg transition-colors duration-200 cursor-pointer',
                    c.isToday && 'bg-secondary text-on-secondary font-bold',
                    !c.isToday && 'hover:bg-surface-container-low',
                  )}
                >
                  {c.day}
                </span>
              ),
            )}
          </div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-3">
            Upcoming deadlines
          </p>
          <div className="space-y-3">
            {upcomingDeadlines.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">
                No upcoming deadlines.
              </p>
            )}
            {upcomingDeadlines.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border-l-4 border-secondary group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-label-md text-on-surface truncate">{p.name}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
