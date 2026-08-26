/**
 * Page hook for Mark Attendance — session, breaks, clock, log rows, manual entry.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { safeNavigate } from '@/shared/lib/safeNavigate'
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
import type { WorkLogRow } from '../components/attendance/WorkingHoursLog'
import { myWorkRoutes } from '../routes'

export type WorkStatus = 'Present' | 'WFH' | 'Leave'

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

function dayPct(iso: string, now = Date.now()): number {
  const d = new Date(iso)
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const ms = Math.min(now, d.getTime()) - start.getTime()
  return Math.min(100, Math.max(0, (ms / 86_400_000) * 100))
}

export function useMarkAttendance() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [status, setStatus] = useState<WorkStatus>('Present')
  const [submitting, setSubmitting] = useState(false)
  const [tick, setTick] = useState(0)
  const [manualToast, setManualToast] = useState<string | null>(null)

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

  const logRows: WorkLogRow[] = useMemo(() => {
    const rows: WorkLogRow[] = []
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

  const handleCheckIn = useCallback(() => {
    if (status !== 'Present') return
    setSubmitting(true)
    checkInNow()
    setSubmitting(false)
  }, [status])

  const handleCheckOut = useCallback(() => {
    setSubmitting(true)
    checkOutNow()
    setSubmitting(false)
  }, [])

  const resetManual = useCallback(() => {
    setManualDate(new Date().toISOString().slice(0, 10))
    setManualReason('Client Meeting')
    setManualIn('09:00')
    setManualOut('18:00')
    setManualNote('')
  }, [])

  const submitManual = useCallback(() => {
    if (!manualDate || !manualNote.trim()) {
      setManualToast('Date and justification note are required.')
      window.setTimeout(() => setManualToast(null), 2500)
      return
    }
    setManualToast('Manual entry submitted for HR approval.')
    window.setTimeout(() => {
      setManualToast(null)
      safeNavigate(navigate, { to: myWorkRoutes.attendanceCorrections })
    }, 900)
  }, [manualDate, manualNote, navigate])

  const goCorrections = useCallback(() => {
    safeNavigate(navigate, { to: myWorkRoutes.attendanceCorrections })
  }, [navigate])

  return {
    now,
    status,
    setStatus,
    submitting,
    manualToast,
    manualDate,
    setManualDate,
    manualReason,
    setManualReason,
    manualIn,
    setManualIn,
    manualOut,
    setManualOut,
    manualNote,
    setManualNote,
    session,
    summary,
    breaks,
    checkedIn,
    hasSession,
    timeLabel,
    ampm,
    logRows,
    markerPct,
    totalLoggedLabel,
    handleCheckIn,
    handleCheckOut,
    resetManual,
    submitManual,
    goCorrections,
    formatClockTime,
    formatHoursCompact,
    attendanceBackTo: myWorkRoutes.attendance,
  }
}
