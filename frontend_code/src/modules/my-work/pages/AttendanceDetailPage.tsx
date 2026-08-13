import { useParams, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { attendanceHistory } from '../data/mock'
import type { AttendanceStatus } from '../types'

const statusStyles: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-50 text-emerald-700',
  Absent: 'bg-red-50 text-red-700',
  'Half Day': 'bg-amber-50 text-amber-800',
  'On Leave': 'bg-blue-50 text-blue-700',
  Holiday: 'bg-violet-50 text-violet-700',
  Weekend: 'bg-surface-container text-on-surface-variant',
}

export function AttendanceDetailPage() {
  const { attendanceId } = useParams({ strict: false }) as { attendanceId: string }
  const navigate = useNavigate()
  const record = attendanceHistory.find((r) => r.id === attendanceId) ?? attendanceHistory[0]

  if (!record) {
    return (
      <div>
        <PageHeader title="Attendance details" showBack />
        <p className="text-body-md text-on-surface-variant">Record not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={`Attendance · ${record.date}`}
        description="Day detail and correction options."
        showBack
        actions={
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/my-work/attendance/corrections' })}
          >
            Request correction
          </Button>
        }
      />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant">Status</span>
          <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${statusStyles[record.status]}`}>
            {record.status}
          </span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-label-sm text-on-surface-variant">Date</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{record.date}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Shift</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{record.shift ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Check-in</dt>
            <dd className="text-body-md font-semibold text-secondary mt-0.5">{record.checkIn ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Check-out</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{record.checkOut ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Total hours</dt>
            <dd className="text-body-md font-semibold text-on-background mt-0.5">{record.totalHours ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-on-surface-variant">Note</dt>
            <dd className="text-body-md text-on-background mt-0.5">{record.note ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
