import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
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
import {
  formatDuration,
  getElapsedMs,
  getTodayBreaks,
  subscribeBreakChange,
} from '../lib/break-session'
import { currentUser } from '../data/mock'

type WorkStatus = 'Present' | 'WFH' | 'Leave'

type LogRow = {
  id: string
  activity: string
  time: string
  duration: string
  statusLabel: string
  statusTone: 'ok' | 'warn' | 'neutral'
  location: string
}

const MANUAL_REASONS = [
  { value: 'Client Meeting', label: 'Client Meeting' },
  { value: 'System Issue', label: 'System Issue' },
  { value: 'Forgot to Log', label: 'Forgot to Log' },
  { value: 'Travel', label: 'Travel' },
] as const

function shiftStartToday(): Date {
  const d = new Date()
  d.setHours(9, 0, 0, 0)
  return d
}

function isOnTime(checkInIso: string): boolean {
  const inMs = new Date(checkInIso).getTime()
  const grace = shiftStartToday().getTime() + 15 * 60 * 1000
  return inMs <= grace
}

/** Percent of 24h day for timeline marker (0–100). */
function dayPct(iso: string, now = Date.now()): number {
  const d = new Date(iso)
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const ms = Math.min(now, d.getTime()) - start.getTime()
  return Math.min(100, Math.max(0, (ms / 86_400_000) * 100))
}

export function MarkAttendancePage() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [status, setStatus] = useState<WorkStatus>('Present')
  const [submitting, setSubmitting] = useState(false)
  const [tick, setTick] = useState(0)
  const [manualToast, setManualToast] = useState<string | null>(null)

  // Manual attendance entry (correction-style request)
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [manualReason, setManualReason] = useState<string>('Client Meeting')
  const [manualIn, setManualIn] = useState('09:00')
  const [manualOut, setManualOut] = useState('18:00')
  const [manualNote, setManualNote] = useState('')

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
  const summary = getWorkHoursSummary(now.getTime())
  const breaks = getTodayBreaks(now.getTime())
  const checkedIn = Boolean(session && !session.checkOutAt)
  const hasSession = Boolean(session)

  const hours = now.getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = String(hours % 12 || 12).padStart(2, '0')
  const timeLabel = `${displayHours}:${minutes}`

  const logRows: LogRow[] = useMemo(() => {
    const rows: LogRow[] = []
    if (!session) return rows

    rows.push({
      id: 'punch-in',
      activity: 'Punch In',
      time: formatClockTime(session.checkInAt),
      duration: '—',
      statusLabel: isOnTime(session.checkInAt) ? 'On Time' : 'Late',
      statusTone: isOnTime(session.checkInAt) ? 'ok' : 'warn',
      location: 'Office WiFi (HQ-GUEST)',
    })

    for (const b of breaks) {
      const elapsed = getElapsedMs(b, now.getTime())
      rows.push({
        id: b.id,
        activity: b.endedAt ? 'Break' : 'Break (active)',
        time: `${formatClockTime(b.startedAt)}${b.endedAt ? ` – ${formatClockTime(b.endedAt)}` : ''}`,
        duration: formatDuration(elapsed),
        statusLabel: b.endedAt ? 'Completed' : 'In progress',
        statusTone: b.endedAt ? 'neutral' : 'warn',
        location: b.note || '—',
      })
    }

    if (session.checkOutAt) {
      rows.push({
        id: 'punch-out',
        activity: 'Punch Out',
        time: formatClockTime(session.checkOutAt),
        duration: summary ? formatHoursCompact(summary.netMs) : '—',
        statusLabel: 'Complete',
        statusTone: 'ok',
        location: 'Office WiFi (HQ-GUEST)',
      })
    }

    return rows
  }, [session, breaks, now, summary])

  const markerPct = session ? dayPct(session.checkInAt, now.getTime()) : null
  const totalLoggedLabel = summary ? formatHoursCompact(summary.netMs) : '0m'

  const handleCheckIn = () => {
    if (status !== 'Present') return
    setSubmitting(true)
    checkInNow()
    setSubmitting(false)
  }

  const handleCheckOut = () => {
    setSubmitting(true)
    checkOutNow()
    setSubmitting(false)
  }

  const resetManual = () => {
    setManualDate(new Date().toISOString().slice(0, 10))
    setManualReason('Client Meeting')
    setManualIn('09:00')
    setManualOut('18:00')
    setManualNote('')
  }

  const submitManual = () => {
    if (!manualDate || !manualNote.trim()) {
      setManualToast('Date and justification note are required.')
      window.setTimeout(() => setManualToast(null), 2500)
      return
    }
    // Mock submit — same domain as attendance corrections (HR approval).
    setManualToast('Manual entry submitted for HR approval.')
    window.setTimeout(() => {
      setManualToast(null)
      navigate({ to: '/my-work/attendance/corrections' })
    }, 900)
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

      {manualToast && (
        <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-label-md text-secondary">
          {manualToast}
        </div>
      )}

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
                    : 'bg-secondary text-white shadow-secondary/20 hover:opacity-95 cursor-pointer',
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
                    : 'text-on-background hover:bg-surface-container cursor-pointer',
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

        {/* Working Hours Log — live from attendance-session + break-session */}
        <div className="col-span-12 bv-surface p-6">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <h3 className="text-title-lg font-semibold text-on-background">Working Hours Log</h3>
            <div className="text-label-md text-on-surface-variant">
              Total net:{' '}
              <span className="font-bold text-secondary">{totalLoggedLabel} logged today</span>
            </div>
          </div>

          <div className="relative h-16 bg-surface-container rounded-full overflow-hidden mb-6">
            <div className="absolute inset-0 flex text-[10px] text-on-surface-variant/50 pointer-events-none">
              <div className="w-[37.5%] border-r border-white/40 flex items-center justify-center">00:00 – 09:00</div>
              <div className="w-[37.5%] border-r border-white/40 flex items-center justify-center">09:00 – 18:00</div>
              <div className="flex-1 flex items-center justify-center">18:00 – 24:00</div>
            </div>
            {markerPct != null && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-secondary executive-shadow z-10"
                style={{ left: `${markerPct}%` }}
              >
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-secondary rounded-full" />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-secondary whitespace-nowrap">
                  In
                </span>
              </div>
            )}
            {breaks.map((b) => {
              const startPct = dayPct(b.startedAt, now.getTime())
              const endPct = b.endedAt ? dayPct(b.endedAt, now.getTime()) : dayPct(now.toISOString(), now.getTime())
              const width = Math.max(0.5, endPct - startPct)
              return (
                <div
                  key={b.id}
                  className="absolute top-2 bottom-2 rounded bg-error/70 z-[5]"
                  style={{ left: `${startPct}%`, width: `${width}%` }}
                  title={`Break ${formatClockTime(b.startedAt)}`}
                />
              )
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-label-sm text-on-surface-variant border-b border-outline-variant uppercase">
                <tr>
                  <th className="pb-3 font-bold">Activity</th>
                  <th className="pb-3 font-bold">Time</th>
                  <th className="pb-3 font-bold">Duration</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Location / Note</th>
                </tr>
              </thead>
              <tbody className="text-body-sm divide-y divide-outline-variant/30">
                {logRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                      No punches yet today. Check in to start the log.
                    </td>
                  </tr>
                ) : (
                  logRows.map((row) => (
                    <tr key={row.id} className="zebra-row">
                      <td className="py-4 font-medium">{row.activity}</td>
                      <td className="py-4">{row.time}</td>
                      <td className="py-4">{row.duration}</td>
                      <td className="py-4">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-md text-[10px] font-bold uppercase',
                            row.statusTone === 'ok' && 'bg-emerald-100 text-emerald-800',
                            row.statusTone === 'warn' && 'bg-amber-100 text-amber-800',
                            row.statusTone === 'neutral' && 'bg-surface-container text-on-surface-variant',
                          )}
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="py-4 text-on-surface-variant">{row.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Attendance Entry — state wired; submits as correction-style request */}
        <div className="col-span-12 lg:col-span-8 bv-surface p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary">edit_note</span>
            <h3 className="text-title-lg font-semibold text-on-background">Manual Attendance Entry</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-6">
            Permitted for off-site client meetings or connectivity issues. Requires HR approval (same flow as
            attendance corrections).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-date">
                Date
              </label>
              <input
                id="manual-date"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant">Reason Category</label>
              <Select value={manualReason} onChange={setManualReason} options={[...MANUAL_REASONS]} />
            </div>
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-in">
                Time In
              </label>
              <input
                id="manual-in"
                type="time"
                value={manualIn}
                onChange={(e) => setManualIn(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-out">
                Time Out
              </label>
              <input
                id="manual-out"
                type="time"
                value={manualOut}
                onChange={(e) => setManualOut(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none transition-colors"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="block text-label-md font-medium text-on-surface-variant" htmlFor="manual-note">
                Justification Note
              </label>
              <textarea
                id="manual-note"
                rows={3}
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Briefly describe the reason for manual entry…"
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-secondary outline-none resize-none transition-colors"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetManual()
                  navigate({ to: '/my-work/attendance' })
                }}
              >
                Discard
              </Button>
              <Button variant="primary" onClick={submitManual}>
                Request Approval
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-deep-navy text-white rounded-xl p-6 flex flex-col justify-between executive-shadow">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary">info</span>
              <h4 className="text-title-lg font-semibold">Policy Highlights</h4>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                <p className="text-body-sm opacity-90">
                  Grace period for Late marking is 15 minutes past the shift start.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                <p className="text-body-sm opacity-90">
                  Location must be within 500m of the office perimeter for verified punch-in.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-secondary shrink-0">check_circle</span>
                <p className="text-body-sm opacity-90">
                  Attendance corrections must be submitted within 48 hours of the missing log.
                </p>
              </li>
            </ul>
          </div>
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-label-sm font-bold mb-2 uppercase opacity-80">Approval Status</p>
            <button
              type="button"
              className="w-full flex justify-between items-center text-left hover:opacity-90"
              onClick={() => navigate({ to: '/my-work/attendance/corrections' })}
            >
              <span className="text-body-sm">Pending Corrections</span>
              <span className="px-2 py-0.5 bg-secondary text-white rounded text-[10px] font-bold">VIEW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
