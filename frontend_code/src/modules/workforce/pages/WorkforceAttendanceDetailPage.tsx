import { useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { cn } from '@/shared/lib/cn'
import { todayAttendance, attendanceLogs } from '../data/attendanceMock'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'

const statusClass: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800',
  LATE: 'bg-amber-100 text-amber-800',
  ABSENT: 'bg-rose-100 text-rose-800',
  WFH: 'bg-violet-100 text-violet-800',
  ON_LEAVE: 'bg-sky-100 text-sky-800',
}

export function WorkforceAttendanceDetailPage() {
  const params = useParams({ strict: false }) as { attendanceId?: string }
  const attendanceId = params.attendanceId
  const row = todayAttendance.find((r) => r.id === attendanceId) ?? todayAttendance[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={row.name}
        description={`${row.department} · attendance detail`}
        showBack
        backTo="/workforce/attendance"
        backLabel="Back to attendance"
        breadcrumbs={<DynamicRouteCrumbs lastLabel={row.name} />}
      />

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-lg font-bold">
          {row.avatar}
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', statusClass[row.status])}>
          {row.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Check in', value: row.checkIn },
          { label: 'Check out', value: row.checkOut },
          { label: 'Hours', value: row.hours },
        ].map((c) => (
          <div key={c.label} className="bv-surface card-hover p-4">
            <p className="text-caption text-on-surface-variant">{c.label}</p>
            <p className="text-headline-md font-semibold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="bv-surface p-5">
        <h2 className="text-title-md font-semibold mb-3">Punch log</h2>
        <ul className="divide-y divide-outline-variant/20">
          {attendanceLogs.map((l, i) => (
            <li key={i} className="flex justify-between gap-2 py-3 text-body-sm">
              <div>
                <p className="font-medium">{l.action}</p>
                <p className="text-caption text-on-surface-variant">{l.location}</p>
              </div>
              <div className="text-right text-caption text-on-surface-variant">
                <div>{l.time}</div>
                <div>{l.duration}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bv-surface p-5">
        <h2 className="text-title-md font-semibold mb-2">Geolocation</h2>
        <p className="text-body-sm text-on-surface-variant">
          Punch in/out matched corporate headquarters within 15 meters.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-caption">
            Trusted network
          </span>
          <span className="rounded-full bg-surface-container text-on-surface-variant px-2 py-1 text-caption">
            HQ perimeter
          </span>
        </div>
      </section>
    </div>
  )
}
