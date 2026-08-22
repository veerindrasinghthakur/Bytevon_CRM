import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import {
  checkInNow,
  checkOutNow,
  formatClockTime,
  formatHoursCompact,
  getTodayAttendance,
  getWorkHoursSummary,
  subscribeAttendanceChange,
} from '../lib/attendance-session'
import { subscribeBreakChange } from '../lib/break-session'
import { currentUser } from '../data/mock'

type WorkStatus = 'Present' | 'WFH' | 'Leave'

export function MarkAttendancePage() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [status, setStatus] = useState<WorkStatus>('Present')
  const [submitting, setSubmitting] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1)
    const u1 = subscribeAttendanceChange(refresh)
    const u2 = subscribeBreakChange(refresh)
    return () => {
      u1()
      u2()
    }
  }, [])

  void tick
  const session = getTodayAttendance()
  const summary = getWorkHoursSummary()
  const checkedIn = Boolean(session && !session.checkOutAt)
  const hasSession = Boolean(session)

  const hours = now.getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = String(hours % 12 || 12).padStart(2, '0')
  const timeLabel = `${displayHours}:${minutes}`

  const handleCheckIn = async () => {
    if (status !== 'Present') return
    setSubmitting(true)
    checkInNow()
    setSubmitting(false)
  }

  const handleCheckOut = async () => {
    setSubmitting(true)
    checkOutNow()
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/my-work/attendance" label="Back to attendance" />
      <PageHeader
        title="Mark Attendance"
        description={`Hello, ${currentUser.name}. Log your daily check-in — time is recorded exactly when you punch.`}
        actions={
          <div className="flex items-center gap-2 text-label-md font-semibold text-secondary">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>{currentUser.todayLabel}</span>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bv-surface p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-label-sm border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Verified Location
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="w-48 h-48 rounded-full border-8 border-surface-container-high flex flex-col items-center justify-center mb-6 executive-shadow"
              style={{
                background: 'radial-gradient(circle at center, #f8f9ff 0%, #dce9ff 100%)',
              }}
            >
              <span className="text-5xl font-bold text-secondary tracking-tighter">{timeLabel}</span>
              <span className="text-label-md text-on-surface-variant font-medium">{ampm}</span>
            </div>

            <div className="flex gap-4 w-full max-w-md mt-2">
              <button
                type="button"
                disabled={hasSession || submitting || status !== 'Present'}
                onClick={handleCheckIn}
                className={cn(
                  'flex-1 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 executive-shadow',
                  hasSession || status !== 'Present'
                    ? 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'bg-secondary text-white shadow-secondary/20 hover:opacity-95 cursor-pointer'
                )}
              >
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  login
                </span>
                <span>Check In</span>
              </button>
              <button
                type="button"
                disabled={!checkedIn || submitting}
                onClick={handleCheckOut}
                className={cn(
                  'flex-1 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-1 border border-outline-variant transition-colors',
                  !checkedIn
                    ? 'text-on-surface-variant opacity-50 cursor-not-allowed'
                    : 'text-on-background hover:bg-surface-container cursor-pointer'
                )}
              >
                <span className="material-symbols-outlined text-[32px]">logout</span>
                <span>Check Out</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-outline-variant flex justify-around">
            <div className="text-center">
              <p className="text-label-sm text-on-surface-variant uppercase">Shift Starts</p>
              <p className="text-title-lg font-bold text-on-background">09:00 AM</p>
            </div>
            <div className="text-center">
              <p className="text-label-sm text-on-surface-variant uppercase">Shift Ends</p>
              <p className="text-title-lg font-bold text-on-background">06:00 PM</p>
            </div>
            <div className="text-center">
              <p className="text-label-sm text-on-surface-variant uppercase">Net hours</p>
              <p className="text-title-lg font-bold text-on-background">
                {summary ? formatHoursCompact(summary.netMs) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bv-surface p-6">
            <h3 className="text-label-sm font-bold text-on-surface-variant uppercase mb-4">Current Status</h3>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'Present' as const, icon: 'business_center', label: 'Present', enabled: true },
                  { id: 'WFH' as const, icon: 'home_work', label: 'WFH', enabled: false },
                  { id: 'Leave' as const, icon: 'person_off', label: 'Leave', enabled: false },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.enabled}
                  onClick={() => s.enabled && setStatus(s.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all',
                    !s.enabled && 'opacity-40 cursor-not-allowed',
                    s.enabled && status === s.id
                      ? 'border-secondary bg-secondary/10 text-secondary cursor-pointer'
                      : s.enabled
                        ? 'border-transparent bg-surface-container text-on-surface-variant hover:border-outline-variant cursor-pointer'
                        : 'border-transparent bg-surface-container text-on-surface-variant',
                  )}
                  title={!s.enabled ? 'Not available in this release' : undefined}
                >
                  <span
                    className="material-symbols-outlined mb-2"
                    style={status === s.id && s.enabled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {s.icon}
                  </span>
                  <span className="text-label-sm font-bold">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="text-label-sm text-on-surface-variant mt-3">
              Only <strong className="text-on-surface">Present</strong> check-in is enabled for now.
            </p>
          </div>

          <div className="bv-surface p-6">
            <h3 className="text-label-sm font-bold text-on-surface-variant uppercase mb-3">Today</h3>
            <dl className="space-y-2 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Check-in</dt>
                <dd className="font-semibold text-on-background">
                  {session ? formatClockTime(session.checkInAt) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Check-out</dt>
                <dd className="font-semibold text-on-background">
                  {session?.checkOutAt ? formatClockTime(session.checkOutAt) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Break time</dt>
                <dd className="font-semibold text-on-background">
                  {summary ? formatHoursCompact(summary.breakMs) : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
