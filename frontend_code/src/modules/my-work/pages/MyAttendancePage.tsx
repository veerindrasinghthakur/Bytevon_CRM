import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { todayAttendance, weekHours } from '../data/mock'

export function MyAttendancePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Nav-root: no back */}
      <PageHeader
        title="My Attendance"
        description="Track check-in, hours, and request corrections."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/my-work/attendance/corrections' })}
            >
              Corrections
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-lg">fingerprint</span>}
              onClick={() => navigate({ to: '/my-work/attendance/mark' })}
            >
              Mark attendance
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle">
          <p className="text-label-sm text-on-surface-variant mb-1">Check-in</p>
          <p className="text-headline-md font-bold text-secondary">{todayAttendance.checkIn}</p>
          <p className="text-caption text-on-surface-variant">{todayAttendance.checkInNote}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle">
          <p className="text-label-sm text-on-surface-variant mb-1">Total hours</p>
          <p className="text-headline-md font-bold">{todayAttendance.totalHours}</p>
          <p className="text-caption text-on-surface-variant">{todayAttendance.totalHoursNote}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-subtle">
          <p className="text-label-sm text-on-surface-variant mb-1">This week</p>
          <div className="h-12 flex items-end gap-1 mt-2">
            {weekHours.map((d) => (
              <div
                key={d.day}
                className={`flex-1 rounded-t-sm ${d.isToday ? 'bg-secondary' : 'bg-secondary/20'}`}
                style={{ height: `${Math.max(d.pct, 8)}%` }}
                title={`${d.day}: ${d.hours}h`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
