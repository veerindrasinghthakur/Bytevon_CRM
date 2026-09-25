import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { cn } from '@/shared/lib/cn'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import {
  workforceAttendanceStatusStyles,
  WORKFORCE_ATTENDANCE_STATUS_OPTIONS,
} from '../schemas/enums'
import { workforceRoutes } from '../routes'
import {
  useAttendanceRange,
  useDecideCorrection,
  usePendingCorrections,
  useTodayAttendance,
} from '../hooks/use-attendance'
import { listEmployments } from '../api/employment'
import { useQuery } from '@tanstack/react-query'
import type { TodayAttendanceRow } from '../types'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDaysISO(s: string, n: number): string {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

function mondayOf(s: string): string {
  const d = parseISO(s)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return toISO(d)
}

function prettyDay(s: string): string {
  return parseISO(s).toLocaleDateString(undefined, { weekday: 'short' })
}

function shortTime(value: string | null): string {
  if (!value) return '—'
  const m = value.match(/T(\d{2}):(\d{2})/)
  if (m) {
    const h = Number(m[1])
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${String(h12).padStart(2, '0')}:${m[2]} ${suffix}`
  }
  return value
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'E'
  )
}

const INACTIVE_EMP_STATES = new Set(['RESIGNED', 'TERMINATED', 'ALUMNI'])

export function AttendanceDashboardPage() {
  const navigate = useNavigate()
  const todayISO = useMemo(() => toISO(new Date()), [])
  const [dateStr, setDateStr] = useState(todayISO)
  const [weekStart, setWeekStart] = useState(() => mondayOf(toISO(new Date())))
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingDecision, setPendingDecision] = useState<{
    approvalRequestId: number
    decision: 'approve' | 'reject'
    employmentName: string
    attendanceDate: string | null
    requestedCheckIn: string | null
    requestedCheckOut: string | null
    reason: string
  } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')

  const isToday = dateStr === todayISO
  const weekEnd = useMemo(() => addDaysISO(weekStart, 6), [weekStart])
  const prevWeekStart = useMemo(() => addDaysISO(weekStart, -7), [weekStart])

  // Selected-day rows (org-wide, real backend range endpoint).
  const dayQuery = useAttendanceRange(dateStr, dateStr)
  // Both weeks for the paired graph (selected week vs previous week).
  const weeksQuery = useAttendanceRange(prevWeekStart, weekEnd)
  const todayQuery = useTodayAttendance()
  const correctionsQuery = usePendingCorrections()
  const decideMut = useDecideCorrection()
  const employeesQuery = useQuery({
    queryKey: ['workforce', 'employments', 'attendance-denominator'],
    queryFn: () => listEmployments({ page: 1, pageSize: 300 }),
    staleTime: 60_000,
  })

  const empMap = useMemo(() => {
    const map = new Map<number, { name: string; department: string }>()
    for (const e of employeesQuery.data?.items ?? []) {
      if (INACTIVE_EMP_STATES.has(String(e.current_state))) continue
      map.set(e.id, { name: e.fullName, department: e.departmentName })
    }
    return map
  }, [employeesQuery.data])

  const dayRows = useMemo(() => dayQuery.data ?? [], [dayQuery.data])

  // Full-day table: every active employment left-joined with its day row.
  const tableRows: TodayAttendanceRow[] = useMemo(() => {
    if (isToday && todayQuery.data) {
      const seen = new Set<number>()
      const rows: TodayAttendanceRow[] = [...todayQuery.data.items]
      // Names in today_list are authoritative; index them for absent fill-in.
      for (const r of todayQuery.data.items) {
        const hit = [...empMap.entries()].find(([, v]) => v.name === r.name)
        if (hit) seen.add(hit[0])
      }
      for (const [id, v] of empMap) {
        if (!seen.has(id)) {
          rows.push({
            id: `emp-${id}`,
            name: v.name,
            avatar: initials(v.name),
            department: v.department,
            checkIn: '—',
            checkOut: '—',
            status: 'ABSENT',
            hours: '—',
          })
        }
      }
      return rows
    }
    const byEmp = new Map(dayRows.map((d) => [d.employment_id, d]))
    return [...empMap.entries()].map(([id, v]) => {
      const d = byEmp.get(id)
      return {
        id: d ? String(d.id) : `emp-${id}`,
        name: v.name,
        avatar: initials(v.name),
        department: v.department,
        checkIn: '—',
        checkOut: '—',
        status: d?.status ?? 'ABSENT',
        hours: d?.working_hours != null ? `${Number(d.working_hours).toFixed(1)}h` : '—',
      }
    })
  }, [isToday, todayQuery.data, empMap, dayRows])

  const rows = useMemo(() => {
    const q = query.toLowerCase()
    return tableRows.filter((r) => {
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tableRows, query, statusFilter])

  const kpis = useMemo(() => {
    const total = tableRows.length
    const present = tableRows.filter((r) => r.status === 'PRESENT').length
    const half = tableRows.filter((r) => r.status === 'HALF_DAY').length
    const absent = tableRows.filter((r) => r.status === 'ABSENT').length
    const onLeave = tableRows.filter((r) => r.status === 'ON_LEAVE').length
    const hours = dayRows.reduce((s, d) => s + (Number(d.working_hours) || 0), 0)
    const pct = total > 0 ? Math.round(((present + half * 0.5) / total) * 1000) / 10 : 0
    return [
      { key: 'present', label: 'Present', value: present, hint: `of ${total} active`, icon: 'check_circle' },
      { key: 'absent', label: 'Absent', value: absent, hint: `on ${dateStr}`, icon: 'cancel' },
      { key: 'attendancePct', label: 'Attendance %', value: pct, hint: 'present + half days', icon: 'percent' },
      { key: 'worked', label: 'Hours worked', value: Math.round(hours * 10) / 10, hint: `on ${dateStr}`, icon: 'schedule' },
      { key: 'leave', label: 'On Leave', value: onLeave, hint: `on ${dateStr}`, icon: 'event_busy' },
    ]
  }, [tableRows, dayRows, dateStr])

  const weekly = useMemo(() => {
    const all = weeksQuery.data ?? []
    const presentOn = (iso: string) =>
      all.filter((d) => d.attendance_date === iso && d.status === 'PRESENT').length
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDaysISO(weekStart, i)
      const prevIso = addDaysISO(prevWeekStart, i)
      return { day: prettyDay(iso), thisWeek: presentOn(iso), lastWeek: presentOn(prevIso) }
    })
  }, [weeksQuery.data, weekStart, prevWeekStart])

  const maxBar = Math.max(...weekly.map((d) => Math.max(d.thisWeek, d.lastWeek)), 1)
  const weekTotal = weekly.reduce((s, d) => s + d.thisWeek, 0)
  const weekAvg =
    empMap.size > 0
      ? Math.round((weekTotal / (empMap.size * 7)) * 1000) / 10
      : 0

  const recentCheckIns = useMemo(() => {
    const items = todayQuery.data?.items ?? []
    return items
      .filter((r) => r.checkIn && r.checkIn !== '—')
      .slice(0, 5)
      .map((r) => ({ id: r.id, name: r.name, team: r.department, time: r.checkIn, status: r.status }))
  }, [todayQuery.data])

  const corrections = useMemo(() => (correctionsQuery.data ?? []).slice(0, 8), [correctionsQuery.data])

  const isLoading =
    dayQuery.isLoading || weeksQuery.isLoading || employeesQuery.isLoading || todayQuery.isLoading
  const isError = dayQuery.isError || weeksQuery.isError || employeesQuery.isError
  const error = dayQuery.error ?? weeksQuery.error ?? employeesQuery.error

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(error, 'Failed to load attendance')}
        onRetry={() => {
          void dayQuery.refetch()
          void weeksQuery.refetch()
          void employeesQuery.refetch()
        }}
        onBack={() => window.history.back()}
      />
    )
  }

  const askDecide = (correction: {
    approval_request_id: number | null
    employment_name: string | null
    attendance_date: string | null
    requested_check_in: string | null
    requested_check_out: string | null
    reason: string
  }, decision: 'approve' | 'reject') => {
    setActionError(null)
    if (correction.approval_request_id == null) return
    setDecisionReason('')
    setPendingDecision({
      approvalRequestId: correction.approval_request_id,
      decision,
      employmentName: correction.employment_name ?? '—',
      attendanceDate: correction.attendance_date,
      requestedCheckIn: correction.requested_check_in,
      requestedCheckOut: correction.requested_check_out,
      reason: correction.reason,
    })
  }

  const confirmDecide = () => {
    if (!pendingDecision) return
    if (pendingDecision.decision === 'reject' && !decisionReason.trim()) {
      setActionError('A reason is required to reject a correction')
      return
    }
    decideMut.mutate(
      {
        approvalRequestId: pendingDecision.approvalRequestId,
        decision: pendingDecision.decision,
        reason: decisionReason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPendingDecision(null)
          setDecisionReason('')
        },
        onError: (e) => setActionError(getApiErrorMessage(e, `Could not ${pendingDecision.decision} correction`)),
      },
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Attendance Dashboard"
        description="Real-time monitoring of your organisation's workforce status."
        breadcrumbs={<DynamicRouteCrumbs />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              Date
              <input
                type="date"
                value={dateStr}
                max={todayISO}
                onChange={(e) => e.target.value && setDateStr(e.target.value)}
                className="px-3 py-2 border border-outline-variant rounded-lg bg-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </label>
            <Button
              variant="outline"
              leftIcon={<Icon name="calendar_view_month" />}
              onClick={() => safeNavigate(navigate, { to: workforceRoutes.attendanceRoster })}
            >
              Roster
            </Button>
            <Button
              variant="outline"
              leftIcon={<Icon name="groups" />}
              onClick={() => safeNavigate(navigate, { to: workforceRoutes.attendanceEmployees })}
            >
              All employees
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.key} className="bv-surface card-hover p-5">
            <div className="flex justify-between mb-2">
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Icon name={k.icon} className="text-lg" />
              </div>
            </div>
            <div className="text-headline-xl font-bold">{k.value.toLocaleString()}</div>
            <p className="text-caption text-on-surface-variant mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bv-surface p-5">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div>
              <h2 className="text-title-md font-semibold text-on-background">Weekly attendance</h2>
              <p className="text-caption text-on-surface-variant">
                Avg. rate: {weekAvg}% · week of {weekStart}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Icon name="chevron_left" />}
                onClick={() => setWeekStart((w) => addDaysISO(w, -7))}
              >
                Prev
              </Button>
              <input
                type="date"
                value={weekStart}
                max={todayISO}
                onChange={(e) => e.target.value && setWeekStart(mondayOf(e.target.value))}
                aria-label="Select week"
                title="Select week"
                className="px-2 py-1.5 border border-outline-variant rounded-lg bg-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={weekStart >= mondayOf(todayISO)}
                onClick={() => setWeekStart((w) => addDaysISO(w, 7))}
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekStart(mondayOf(todayISO))}
              >
                This week
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-2 text-caption text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" /> Selected week
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-outline-variant" /> Previous week
            </span>
          </div>
          <div className="flex h-40 items-end gap-3">
            {weekly.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t bg-outline-variant/60"
                    style={{ height: `${(d.lastWeek / maxBar) * 100}%` }}
                    title={`Previous: ${d.lastWeek}`}
                  />
                  <div
                    className="w-2.5 rounded-t bg-secondary"
                    style={{ height: `${(d.thisWeek / maxBar) * 100}%` }}
                    title={`Selected: ${d.thisWeek}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-on-surface-variant">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bv-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-title-md font-semibold">Recent check-ins</h2>
            <Link
              {...looseLinkProps({
                to: workforceRoutes.attendanceEmployees,
                className: 'text-label-sm text-secondary hover:underline',
              })}
            >
              View all
            </Link>
          </div>
          {recentCheckIns.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant py-6 text-center">
              No check-ins today yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentCheckIns.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-body-sm font-medium text-on-background">{c.name}</p>
                    <p className="text-caption text-on-surface-variant">
                      {c.team} · {c.time}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      workforceAttendanceStatusStyles[c.status] ?? 'status-badge status-neutral',
                    )}
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bv-surface overflow-hidden">
          <div className="p-4 border-b border-outline-variant/30 flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-title-md font-semibold">
              Attendance · {parseISO(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </h2>
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1 justify-end">
              <div className="relative min-w-[160px] flex-1 max-w-xs">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
                  placeholder="Search…"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[...WORKFORCE_ATTENDANCE_STATUS_OPTIONS]}
                minWidthClass="min-w-[140px]"
                aria-label="Filter by status"
              />
              {(query || statusFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  className="!py-2 !px-2 text-label-sm"
                  onClick={() => {
                    setQuery('')
                    setStatusFilter('ALL')
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Employee</th>
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase hidden sm:table-cell">Department</th>
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Check in</th>
                <th className="px-4 py-3 text-label-sm font-medium text-on-surface-variant uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-on-surface-variant text-body-sm">
                    No attendance records match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="zebra-row cursor-pointer"
                    onClick={() =>
                      safeNavigate(navigate, {
                        to: workforceRoutes.attendanceRecordPath,
                        params: { attendanceId: r.id },
                      })
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                          {r.avatar}
                        </div>
                        <span className="font-medium text-body-sm">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant hidden sm:table-cell">{r.department}</td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant">{r.checkIn}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold',
                          workforceAttendanceStatusStyles[r.status] ?? 'status-badge status-neutral',
                        )}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="bv-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-title-md font-semibold">Corrections</h2>
            <span className="rounded-full status-badge status-warning px-2 py-0.5 text-[10px] font-bold">
              {corrections.length} pending
            </span>
          </div>
          {actionError && (
            <p className="text-body-sm text-error mb-2" role="alert">
              {actionError}
            </p>
          )}
          {corrections.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant py-6 text-center">
              No pending corrections.
            </p>
          ) : (
            <ul className="space-y-4">
              {corrections.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-outline-variant/40 bg-surface-container-low/40 p-3"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-body-sm font-medium">{c.employment_name ?? '—'}</span>
                    <span className="text-caption text-on-surface-variant">{c.attendance_date ?? ''}</span>
                  </div>
                  {(c.requested_check_in || c.requested_check_out) && (
                    <p className="text-caption text-on-surface-variant mt-1">
                      Requested: {shortTime(c.requested_check_in)} – {shortTime(c.requested_check_out)}
                    </p>
                  )}
                  <p className="text-caption text-on-surface-variant mt-1">&ldquo;{c.reason}&rdquo;</p>
                  {c.approval_request_id != null && (
                    <div className="mt-2 flex gap-2">
                      <Can action={Action.APPROVE} resource="attendance">
                        <Button
                          variant="primary"
                          className="!py-1 !px-2 !text-[11px]"
                          isLoading={decideMut.isPending}
                          onClick={() => askDecide(c, 'approve')}
                        >
                          Approve
                        </Button>
                      </Can>
                      <Can action={Action.APPROVE} resource="attendance">
                        <Button
                          variant="outline"
                          className="!py-1 !px-2 !text-[11px]"
                          disabled={decideMut.isPending}
                          onClick={() => askDecide(c, 'reject')}
                        >
                          Reject
                        </Button>
                      </Can>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {pendingDecision && (
        <Modal
          title={pendingDecision.decision === 'approve' ? 'Approve correction' : 'Reject correction'}
          onClose={() => !decideMut.isPending && setPendingDecision(null)}
        >
          <div className="space-y-4">
            <div className="bg-surface-container-low rounded-lg p-4 text-body-sm space-y-1">
              <p><span className="text-on-surface-variant">Employee: </span><span className="font-semibold">{pendingDecision.employmentName}</span></p>
              <p><span className="text-on-surface-variant">Date: </span><span className="font-semibold">{pendingDecision.attendanceDate ?? '—'}</span></p>
              <p>
                <span className="text-on-surface-variant">Requested: </span>
                <span className="font-semibold">
                  {shortTime(pendingDecision.requestedCheckIn)} – {shortTime(pendingDecision.requestedCheckOut)}
                </span>
              </p>
              <p><span className="text-on-surface-variant">Reason: </span>&ldquo;{pendingDecision.reason}&rdquo;</p>
            </div>
            <div>
              <label className="block text-label-md mb-1">
                {pendingDecision.decision === 'reject' ? 'Reason (required)' : 'Note (optional)'}
              </label>
              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                rows={3}
                placeholder={
                  pendingDecision.decision === 'reject'
                    ? 'Why is this correction rejected?'
                    : 'Optional note for the employee…'
                }
                className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={decideMut.isPending} onClick={() => setPendingDecision(null)}>
                Cancel
              </Button>
              <Button
                variant={pendingDecision.decision === 'approve' ? 'primary' : 'danger'}
                size="sm"
                disabled={decideMut.isPending || (pendingDecision.decision === 'reject' && !decisionReason.trim())}
                onClick={confirmDecide}
              >
                {decideMut.isPending
                  ? 'Confirming…'
                  : pendingDecision.decision === 'approve'
                    ? 'Confirm Approve'
                    : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
