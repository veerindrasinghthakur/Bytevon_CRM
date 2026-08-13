import { PageHeader } from '@/shared/components/layout/PageHeader'
import { attendanceHistory } from '../data/mock'

export function AttendanceCorrectionsPage() {
  const candidates = attendanceHistory.filter(
    (r) => r.status === 'Half Day' || r.note
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance corrections"
        description="Request changes to past attendance records."
        showBack
      />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        {candidates.length === 0 ? (
          <p className="p-6 text-body-md text-on-surface-variant">No correction candidates in mock data.</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {candidates.map((r) => (
              <li key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <p className="text-label-md font-semibold text-on-background">{r.date}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {r.status} · {r.note ?? 'No note'}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-label-md font-medium text-secondary hover:underline"
                >
                  Submit correction
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
