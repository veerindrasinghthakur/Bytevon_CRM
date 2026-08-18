import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getHolidayCalendars } from '../api/organization'
import type { HolidayCalendarRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

export function HolidayCalendarsPage() {
  const [items, setItems] = useState<HolidayCalendarRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHolidayCalendars()
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoadingSkeleton />
  if (error) return <ErrorState description={error} />

  return (
    <div className="space-y-6">
      <PageHeader title="Holiday calendars" description="Calendars linked to office locations" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((c) => (
          <Link
            key={c.id}
            to="/admin/organization/holidays/$calendarId"
            params={{ calendarId: String(c.id) }}
            className="block bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm card-hover"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-title-md font-semibold text-on-background">{c.name}</h3>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                  c.is_archived ? 'bg-surface-container text-on-surface-variant' : 'bg-secondary/15 text-secondary',
                )}
              >
                {c.is_archived ? 'ARCHIVED' : 'ACTIVE'}
              </span>
            </div>
            <p className="mt-2 text-body-sm text-on-surface-variant">View holidays →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
