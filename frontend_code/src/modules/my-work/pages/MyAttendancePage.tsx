import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { currentUser, todayAttendance, attendanceHistory, weekHours } from '../data/mock'
import type { AttendanceStatus } from '../types'

const statusStyles: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-50 text-emerald-700',
  Absent: 'bg-red-50 text-red-700',
  'Half Day': 'bg-amber-50 text-amber-800',
  'On Leave': 'bg-blue-50 text-blue-700',
  Holiday: 'bg-violet-50 text-violet-700',
  Weekend: 'bg-surface-container text-on-surface-variant',
}

export function MyAttendancePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        description="Mark attendance, review daily hours, and track history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              leftIcon={<span className="material-symbols-outlined text-lg">edit_calendar</span>}
              variant="outline"
              onClick={() => navigate({ to: '/my-work/attendance/corrections' })}
            >
              Corrections
            </Button>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">fingerprint</span>}
              onClick={() => navigate({ to: '/my-work/attendance/mark' })}
            >
              Mark Attendance
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">Today</p>
          <p className="text-headline-md font-bold text-on-background">{currentUser.todayLabel}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">Shift · {currentUser.shift}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">Check-in</p>
          <p className="text-headline-md font-bold text-secondary">{todayAttendance.checkIn}</p>
          <p className="text-[11px] text-emerald-600 mt-1.5 font-medium">{todayAttendance.checkInNote}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">Hours today</p>
          <p className="text-headline-md font-bold text-on-background">{todayAttendance.totalHours}</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">{todayAttendance.totalHoursNote}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 shadow-sm">
          <p className="text-label-sm text-on-surface-variant mb-1">Status</p>
          <p className="text-headline-md font-bold text-emerald-600">Present</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">Live session open</p>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm">
        <h3 className="text-title-lg font-semibold text-on-background mb-4">This week</h3>
        <div className="flex items-end gap-3 h-32">
          {weekHours.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-md ${
                  d.isToday ? 'bg-secondary' : d.pct > 0 ? 'bg-secondary/25' : 'bg-outline-variant/40'
                }`}
                style={{ height: d.pct > 0 ? `${d.pct}%` : '4px' }}
                title={`${d.hours}h`}
              />
              <span className="text-label-sm font-medium text-on-surface-variant">{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-title-lg font-semibold text-on-background">Attendance history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Check-in</th>
                <th className="px-6 py-3 font-semibold">Check-out</th>
                <th className="px-6 py-3 font-semibold">Hours</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {attendanceHistory.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-secondary/5 cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: '/my-work/attendance/$attendanceId',
                      params: { attendanceId: row.id },
                    })
                  }
                >
                  <td className="px-6 py-4 text-label-md font-medium text-secondary">{row.date}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.checkIn ?? '—'}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.checkOut ?? '—'}</td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.totalHours ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${statusStyles[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{row.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
