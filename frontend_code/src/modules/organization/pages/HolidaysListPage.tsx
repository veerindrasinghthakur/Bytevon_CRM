import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { useHolidaysList } from '../hooks/use-organization'

export function HolidaysListPage() {
  const { calendarId } = useParams({ strict: false }) as { calendarId: string }
  const id = Number(calendarId)
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useHolidaysList(id)
  const items = data?.items ?? []

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return (
      <ErrorState
        description={(error as Error).message}
        onRetry={() => void refetch()}
        onBack={() => navigate({ to: '/admin/settings/holidays' })}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/admin/settings/holidays" label="Back to calendars" />
      <div>
        <h2 className="text-title-lg font-semibold text-on-background">Holiday schedule</h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">Calendar #{id}</p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No holidays" description="Add holidays to this calendar." />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Name', 'Date', 'Type', 'Recurring'].map((h) => (
                  <th key={h} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b border-outline-variant last:border-0 bv-row-hover">
                  <td className="px-5 py-3 font-medium">{h.name}</td>
                  <td className="px-5 py-3 text-body-sm">{h.date}</td>
                  <td className="px-5 py-3 text-body-sm">{h.holiday_type}</td>
                  <td className="px-5 py-3 text-body-sm">{h.recurring_flag ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
