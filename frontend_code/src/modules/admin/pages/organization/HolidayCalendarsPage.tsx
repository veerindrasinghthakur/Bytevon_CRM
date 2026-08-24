import { Link } from '@tanstack/react-router'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useHolidayCalendars } from '../../hooks/use-organization'
import { cn } from '@/shared/lib/cn'

export function HolidayCalendarsPage() {
  const { data, isLoading, isError, error, refetch } = useHolidayCalendars()
  const items = data?.items ?? []

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-title-lg font-semibold text-on-background">Calendars</h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">
          Holiday calendars linked to office locations — open a calendar to manage holidays
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((c) => (
          <Link
            key={c.id}
            to="/admin/settings/holidays/$calendarId"
            params={{ calendarId: String(c.id) }}
            className="block bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[28px]">calendar_month</span>
                <h3 className="text-title-md font-semibold text-on-background">{c.name}</h3>
              </div>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                  c.is_archived
                    ? 'bg-surface-container text-on-surface-variant'
                    : 'bg-secondary/15 text-secondary',
                )}
              >
                {c.is_archived ? 'ARCHIVED' : 'ACTIVE'}
              </span>
            </div>
            <p className="mt-3 text-body-sm text-on-surface-variant">View holidays inside this calendar →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
