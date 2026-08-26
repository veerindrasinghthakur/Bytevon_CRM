import { useParams, useSearch } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { cn } from '@/shared/lib/cn'
import { workforceRoutes } from '../routes'

const MOCK_PUNCHES = [
  {
    id: 1,
    punch_type: 'CHECK_IN',
    punch_time: '09:32:14',
    is_valid_punch: true,
    client_ip: '203.0.113.42',
    validation_message: null as string | null,
  },
  {
    id: 2,
    punch_type: 'CHECK_OUT',
    punch_time: '18:41:02',
    is_valid_punch: true,
    client_ip: '203.0.113.42',
    validation_message: null as string | null,
  },
]

const MOCK_BREAKS = [
  { id: 1, start: '13:05', end: '13:45', duration_min: 40 },
]

export function AttendanceDayDetailPage() {
  const { employmentId } = useParams({ strict: false }) as { employmentId: string }
  const search = useSearch({ strict: false }) as { date?: string }
  const date = search.date ?? new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={workforceRoutes.attendanceRoster} label="Back to roster" />
      <PageHeader
        title="Attendance day detail"
        description={`Employment #${employmentId} · ${date}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bv-surface card-hover p-5">
          <h3 className="text-title-md font-semibold mb-4">Punches</h3>
          <ul className="space-y-3">
            {MOCK_PUNCHES.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-outline-variant p-3"
              >
                <div>
                  <p className="font-medium">{p.punch_type}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {p.punch_time} · IP {p.client_ip}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    p.is_valid_punch ? 'bg-secondary/15 text-secondary' : 'bg-error/15 text-error',
                  )}
                >
                  {p.is_valid_punch ? 'VALID' : 'INVALID'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bv-surface card-hover p-5">
          <h3 className="text-title-md font-semibold mb-4">Breaks</h3>
          <ul className="space-y-3">
            {MOCK_BREAKS.map((b) => (
              <li key={b.id} className="rounded-lg border border-outline-variant p-3 text-body-sm">
                {b.start} – {b.end} · {b.duration_min} min
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 rounded-lg bg-surface-container-low">
            <p className="text-label-sm text-on-surface-variant">Working hours</p>
            <p className="text-title-lg font-semibold">8.20</p>
          </div>
        </div>
      </div>
    </div>
  )
}
