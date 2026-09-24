/**
 * My Work module API — self-service attendance, leave, tasks, approvals.
 * Server-side pagination/filtering (MODULE_STANDARDS §4).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import {
  approverDirectory,
  attendanceHistory,
  correctionRequestsSeed,
  currentUser,
  holidaysSeed,
  leaveBalances,
  myApprovals,
  myTasks,
  myWorkMetrics,
  myWorkQuickActions,
  recentNotifications,
  todayAttendance,
  upcomingEvents,
  weekHours,
} from '@/shared/mock/data/my-work'
import { DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE, paginateItems } from '@/shared/lib/list-params'
import type {
  ApprovalListResponse,
  ApprovalRequest,
  ApplyLeaveContext,
  AttendanceListResponse,
  AttendanceRecord,
  CorrectionListResponse,
  AttendanceCorrectionRequest,
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveCalculateInput,
  LeaveCalculateResult,
  LeaveListResponse,
  LeaveRequest,
  LeaveTypeOption,
  MyTask,
  MyTaskListResponse,
  MyWorkOverview,
  ApproverOption,
  WeekHourBar,
} from '../types'
import type { ApprovalRow } from '@/modules/approvals/types'

export interface MyWorkListParams {
  search?: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

/**
 * Backend leave codes → UI labels (legacy cached values).
 * Live endpoints return {value: code, label: name}; map at the boundary so
 * self-service keeps working if the master catalog gains new types.
 */
const BACKEND_LEAVE_TYPE_TO_UI: Record<string, string> = {
  CASUAL: 'Casual',
  SICK: 'Sick',
  EARNED: 'Earned',
  LOSS_OF_PAY: 'Unpaid',
  LOP: 'Unpaid',
  UNPAID: 'Unpaid',
  COMP_OFF: 'Comp Off',
  MATERNITY: 'Maternity',
  PATERNITY: 'Paternity',
}

function mapLeaveTypeToUI(value: unknown): string {
  const key = String(value ?? '').toUpperCase()
  return BACKEND_LEAVE_TYPE_TO_UI[key] ?? String(value ?? '')
}

function mapApiLeaveRequest(r: Record<string, unknown>): LeaveRequest {
  return {
    id: String(r.id ?? ''),
    type: mapLeaveTypeToUI(r.type) as LeaveRequest['type'],
    from: String(r.from ?? r.from_date ?? ''),
    to: String(r.to ?? r.to_date ?? ''),
    days: Number(r.days ?? 0),
    reason: String(r.reason ?? ''),
    status: String(r.status ?? 'Pending') as LeaveRequest['status'],
    appliedOn: String(r.appliedOn ?? r.applied_on ?? ''),
    approver: r.approver == null ? undefined : String(r.approver),
    approverRemarks:
      r.approverRemarks == null && r.approver_remarks == null
        ? undefined
        : String(r.approverRemarks ?? r.approver_remarks ?? ''),
    decidedOn:
      r.decidedOn == null && r.decided_on == null
        ? undefined
        : String(r.decidedOn ?? r.decided_on ?? ''),
    halfDay: (r.halfDay ?? r.half_day ?? null) as LeaveRequest['halfDay'],
  }
}

/** Withdraw a pending leave — backend POST /leave/requests/{id}/cancel (releases the HOLD). */
export async function cancelLeaveRequest(id: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    return
  }
  await apiClient.post(`/leave/requests/${encodeURIComponent(id)}/cancel`)
}

/** Backend task codes (HIGH, IN_PROGRESS…) → UI labels (High, In Progress…). */
const BACKEND_TASK_PRIORITY_TO_UI: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

const BACKEND_TASK_STATUS_TO_UI: Record<string, string> = {
  TODO: 'Not Started',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'Pending',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export function mapApiMyTask(r: Record<string, unknown>): MyTask {
  const est = r.estimated_hours ?? r.estimatedHours
  const created = r.created_at ?? r.createdAt
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    project: r.project == null ? undefined : String(r.project),
    priority: (BACKEND_TASK_PRIORITY_TO_UI[String(r.priority ?? '').toUpperCase()] ??
      String(r.priority ?? 'Medium')) as MyTask['priority'],
    dueDate: String(r.due_date ?? r.dueDate ?? ''),
    status: (BACKEND_TASK_STATUS_TO_UI[String(r.status ?? '').toUpperCase()] ??
      String(r.status ?? 'Not Started')) as MyTask['status'],
    estimatedHours:
      est == null || est === '' ? undefined : typeof est === 'number' ? `${est}h` : String(est),
    assignee: r.assignee == null ? undefined : String(r.assignee),
    createdAt: created == null || created === '' ? undefined : String(created).slice(0, 10),
  }
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Mock working-day count — mirrors backend LeavePublicService._working_days */
function mockCountWorkingDays(
  from: string,
  to: string,
  halfDay: boolean,
  holidayDates: Set<string>,
): number {
  if (!from || !to) return halfDay ? 0.5 : 0
  const a = new Date(from + 'T12:00:00')
  const b = new Date(to + 'T12:00:00')
  let days = 0
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue
    const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate())
    if (holidayDates.has(iso)) continue
    days += 1
  }
  if (halfDay && days >= 1) return Math.max(0.5, days - 0.5)
  return days
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Backend sends full ISO datetimes for check-in/out; cards need short local HH:MM. */
function formatClockShort(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return '—'
  const bare = /^(\d{1,2}):(\d{2})(?::\d{2})?(\s*[AP]M)?$/i.exec(value.trim())
  if (bare) return `${bare[1].padStart(2, '0')}:${bare[2]}${bare[3] ? ` ${bare[3].trim()}` : ''}`
  const dt = new Date(value)
  if (!Number.isNaN(dt.getTime())) {
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return '—'
}

const ATTENDANCE_STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week Off',
  NOT_MARKED: 'Not marked',
  UPCOMING: 'Upcoming',
}

/** Backend returns WeekHoursResponse { days: [{ date, status, minutes }] }; UI needs WeekHourBar[]. */
function mapWeekHoursPayload(data: unknown): WeekHourBar[] {
  if (Array.isArray(data)) {
    // Already UI-shaped or list of day objects
    return data.map((raw) => mapOneWeekDay(raw as Record<string, unknown>))
  }
  if (data && typeof data === 'object' && Array.isArray((data as { days?: unknown }).days)) {
    return ((data as { days: unknown[] }).days).map((raw) =>
      mapOneWeekDay(raw as Record<string, unknown>),
    )
  }
  return []
}

function mapOneWeekDay(raw: Record<string, unknown>): WeekHourBar {
  // Already WeekHourBar-like
  if (typeof raw.day === 'string' && typeof raw.hours === 'number') {
    return {
      day: String(raw.day),
      hours: Number(raw.hours),
      pct: Number(raw.pct ?? Math.min(100, (Number(raw.hours) / 8) * 100)),
      isToday: Boolean(raw.isToday),
      isWeekend: Boolean(raw.isWeekend),
      breakMarkers: Array.isArray(raw.breakMarkers) ? (raw.breakMarkers as WeekHourBar['breakMarkers']) : undefined,
    }
  }
  const dateStr = String(raw.date ?? '')
  const mins = Number(raw.minutes ?? 0)
  const hours = mins / 60
  let dow = 0
  let isWeekend = false
  let isToday = false
  if (dateStr) {
    const dt = new Date(dateStr + 'T12:00:00')
    if (!Number.isNaN(dt.getTime())) {
      dow = dt.getDay()
      isWeekend = dow === 0 || dow === 6
      // Local calendar day (not UTC) so isToday matches the server day.
      const n = new Date()
      const todayIso = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
      isToday = dateStr === todayIso
    }
  }
  return {
    day: DAY_NAMES[dow] ?? '—',
    hours,
    pct: Math.min(100, (hours / 8) * 100),
    isToday,
    isWeekend,
  }
}

export async function getMyWorkOverview(): Promise<MyWorkOverview> {
  if (env.useMockApi) {
    await delay()
    return {
      user: { ...currentUser },
      metrics: myWorkMetrics.map((m) => ({ ...m })),
      todayAttendance: { ...todayAttendance },
      weekHours: weekHours.map((w) => ({ ...w })),
      leaveBalances: leaveBalances.map((b) => ({ ...b })),
      tasks: myTasks.map((t) => ({ ...t })),
      notifications: recentNotifications.map((n) => ({ ...n })),
      events: upcomingEvents.map((e) => ({ ...e })),
      quickActions: myWorkQuickActions.map((q) => ({ ...q })),
    }
  }
  const { data } = await apiClient.get<MyWorkOverview>('/my-work/overview')
  // Backend overview shapes differ from UI shapes (WeekHoursResponse object,
  // TodayInfoResponse, numeric employmentId). Normalize so pages never crash.
  const raw = data as unknown as Record<string, unknown>
  const rawUser = (raw.user ?? {}) as Record<string, unknown>
  const rawToday = (raw.todayAttendance ?? null) as Record<string, unknown> | null
  const workedMinutes = Number(rawToday?.workedMinutes ?? 0)
  const hours = Math.floor(workedMinutes / 60)
  const mins = workedMinutes % 60
  return {
    user: {
      name: String(rawUser.name ?? 'User'),
      employeeId: String(rawUser.employmentId ?? rawUser.employeeId ?? ''),
      employeeCode: typeof rawUser.employeeCode === 'string' ? rawUser.employeeCode : undefined,
      department: String(rawUser.department ?? ''),
      role: typeof rawUser.role === 'string' ? (rawUser.role as string) : undefined,
      todayLabel: String(rawUser.todayLabel ?? 'Today'),
      shift: String(rawUser.shift ?? '—'),
    },
    metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
    todayAttendance: {
      checkIn: formatClockShort(rawToday?.checkIn),
      checkInNote:
        typeof rawToday?.status === 'string'
          ? (ATTENDANCE_STATUS_LABEL[String(rawToday.status).toUpperCase()] ?? String(rawToday.status))
          : '',
      totalHours:
        rawToday && (rawToday.checkIn || rawToday.checkOut)
          ? `${hours}h ${mins}m`
          : '—',
      totalHoursNote:
        rawToday?.breakMinutes != null ? `Break ${String(rawToday.breakMinutes)}m` : '',
    },
    weekHours: mapWeekHoursPayload(raw.weekHours),
    leaveBalances: Array.isArray(raw.leaveBalances) ? raw.leaveBalances : [],
    tasks: (Array.isArray(raw.tasks) ? raw.tasks : []).map((t) =>
      mapApiMyTask(t as Record<string, unknown>),
    ),
    notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
    events: Array.isArray(raw.events) ? raw.events : [],
    quickActions: Array.isArray(raw.quickActions) ? raw.quickActions : [],
  } as unknown as MyWorkOverview
}

export async function listMyLeaveRequests(
  params: MyWorkListParams = {},
): Promise<LeaveListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items?: Array<Record<string, unknown>>
      total?: number
    }>('/my-work/leave', { params })
    const items = Array.isArray(data) ? data : (data.items ?? [])
    return {
      items: (Array.isArray(items) ? items : []).map(mapApiLeaveRequest),
      total: Array.isArray(data) ? items.length : (data.total ?? items.length),
      page,
      pageSize,
    }
  }

  await delay()
  // Mock fallback - in production this would be replaced by real API
  let items: LeaveRequest[] = [
    {
      id: 'LV-20240101',
      type: 'Earned',
      from: '2024-01-01',
      to: '2024-01-05',
      days: 5,
      reason: 'Vacation',
      status: 'Approved',
      appliedOn: '2024-01-01',
      approver: 'Manager',
    },
  ]
  if (params.status && params.status !== 'All') {
    items = items.filter((r) => r.status === params.status)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (r) =>
        r.reason.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    )
  }
  const sliced = paginateItems(items, page, pageSize)
  return { ...sliced, page, pageSize }
}

export async function listMyLeaveBalances(): Promise<LeaveBalance[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<Array<Record<string, unknown>>>(
      '/my-work/leave/balances',
    )
    return (Array.isArray(data) ? data : []).map((b) => ({
      type: mapLeaveTypeToUI(b.type) as LeaveBalance['type'],
      used: Number(b.used ?? 0),
      total: Number(b.total ?? 0),
      remaining: Number(b.remaining ?? 0),
    }))
  }
  await delay()
  return leaveBalances.map((b) => ({ ...b }))
}

/** Mock-only catalog fallback (mirrors seeded leave_types master). */
const FALLBACK_LEAVE_TYPE_OPTIONS: LeaveTypeOption[] = [
  { value: 'Casual', label: 'Casual', requires_approval: true },
  { value: 'Sick', label: 'Sick', requires_approval: true },
  { value: 'Earned', label: 'Earned', requires_approval: true },
  { value: 'Maternity', label: 'Maternity', requires_approval: true },
  { value: 'Paternity', label: 'Paternity', requires_approval: true },
  { value: 'Unpaid', label: 'Unpaid', requires_approval: true },
  { value: 'Comp Off', label: 'Comp Off', requires_approval: true },
]

export async function listLeaveTypeOptions(): Promise<LeaveTypeOption[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<Array<Record<string, unknown>>>(
      '/my-work/leave/types',
    )
    return (Array.isArray(data) ? data : []).map((o) => ({
      value: mapLeaveTypeToUI(o.value),
      label: String(o.label ?? mapLeaveTypeToUI(o.value)),
      requires_approval:
        typeof o.requires_approval === 'boolean' ? o.requires_approval : true,
    }))
  }
  await delay()
  return FALLBACK_LEAVE_TYPE_OPTIONS.map((o) => ({ ...o }))
}

export async function getApplyLeaveContext(): Promise<ApplyLeaveContext> {
  if (env.useMockApi) {
    await delay()
    return {
      holidays: [],
    leaveTypes: FALLBACK_LEAVE_TYPE_OPTIONS.map((o) => ({ ...o })),
      balances: leaveBalances.map((b) => ({ ...b })),
    }
  }
  const { data } = await apiClient.get<{
    holidays?: Array<Record<string, unknown>>
    leaveTypes?: Array<Record<string, unknown>>
    balances?: Array<Record<string, unknown>>
  }>('/my-work/leave/apply-context')
  const raw = (data ?? {}) as {
    holidays?: Array<Record<string, unknown>>
    leaveTypes?: Array<Record<string, unknown>>
    balances?: Array<Record<string, unknown>>
  }
  return {
    holidays: (raw.holidays ?? []).map((h) => ({
      date: String(h.date ?? ''),
      name: String(h.name ?? ''),
      holidayType: h.holidayType == null ? undefined : String(h.holidayType),
    })),
    leaveTypes: (raw.leaveTypes ?? []).map((o) => ({
      value: mapLeaveTypeToUI(o.value),
      label: String(o.label ?? mapLeaveTypeToUI(o.value)),
      requires_approval:
        typeof o.requires_approval === 'boolean' ? o.requires_approval : true,
    })),
    balances: (raw.balances ?? []).map((b) => ({
      type: mapLeaveTypeToUI(b.type) as LeaveBalance['type'],
      used: Number(b.used ?? 0),
      total: Number(b.total ?? 0),
      remaining: Number(b.remaining ?? 0),
    })),
  }
}

export async function calculateLeaveDays(
  input: LeaveCalculateInput,
): Promise<LeaveCalculateResult> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Record<string, unknown>>(
      '/my-work/leave/calculate',
      {
        type: input.type,
        from: input.from,
        to: input.to,
        half_day: Boolean(input.halfDay),
      },
    )
    const balanceRemainingRaw = data.balance_remaining ?? data.balanceRemaining
    const estimatedAfterRaw =
      data.estimated_balance_after ?? data.estimatedBalanceAfter
    return {
      dayCost: Number(data.day_cost ?? data.dayCost ?? 0),
      balanceRemaining:
        balanceRemainingRaw == null ? null : Number(balanceRemainingRaw),
      estimatedBalanceAfter:
        estimatedAfterRaw == null ? null : Number(estimatedAfterRaw),
      holidaysInRange: (
        (Array.isArray(data.holidays_in_range)
          ? data.holidays_in_range
          : (data.holidaysInRange as Array<Record<string, unknown>> | undefined)) ?? []
      ).map((h) => ({
        date: String(h.date ?? ''),
        name: String(h.name ?? ''),
        holidayType: h.holidayType == null ? undefined : String(h.holidayType),
      })),
    }
  }
  await delay(80)
  const holidayDates = new Set(holidaysSeed.map((h) => h.date))
  const dayCost = mockCountWorkingDays(
    input.from,
    input.to,
    Boolean(input.halfDay),
    holidayDates,
  )
  const bal = leaveBalances.find((b) => b.type === input.type)
  const remaining = bal?.remaining ?? null
  const estimated =
    remaining == null ? null : Math.max(0, remaining - dayCost)
  const holidaysInRange = holidaysSeed.filter(
    (h) => h.date >= input.from && h.date <= input.to,
  )
  return {
    dayCost,
    balanceRemaining: remaining,
    estimatedBalanceAfter: estimated,
    holidaysInRange,
  }
}

export async function listMyAttendance(
  params: MyWorkListParams & { fromDate?: string; toDate?: string } = {},
): Promise<AttendanceListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { fromDate, toDate, ...rest } = params
    const { data } = await apiClient.get<
      AttendanceListResponse | unknown[] | { items?: unknown[]; total?: number }
    >(
      '/my-work/attendance',
      {
        params: {
          ...rest,
          ...(fromDate ? { from_date: fromDate } : {}),
          ...(toDate ? { to_date: toDate } : {}),
          include_punches: true,
        },
      },
    )
    const rawItems: unknown[] = Array.isArray(data)
      ? data
      : ((data as { items?: unknown[] }).items ?? [])
    const items = rawItems.map((r) => mapApiAttendanceDay(r as Record<string, unknown>))
    return {
      items,
      total: Number((data as { total?: number }).total ?? items.length),
      page,
      pageSize,
    }
  }

  await delay()
  return { items: [], total: 0, page, pageSize }
}

/** Backend AttendanceDay(+punches) → UI AttendanceRecord. */
const BACKEND_ATTENDANCE_STATUS_TO_UI: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Weekend',
  NOT_MARKED: 'Absent',
  NOT_STARTED: 'Absent',
  UPCOMING: 'Absent',
}

function mapApiAttendanceDay(r: Record<string, unknown>): AttendanceRecord {
  const punches = Array.isArray(r.punches) ? (r.punches as Array<Record<string, unknown>>) : []
  let checkIn: string | undefined
  let checkOut: string | undefined
  for (const p of punches) {
    const t = String(p.punch_type ?? p.punchType ?? '').toUpperCase()
    const at = String(p.punch_time ?? p.punchTime ?? '')
    const hm = formatClockShort(at === '' ? undefined : at)
    if (t === 'CHECK_IN' && checkIn == null) checkIn = hm === '—' ? undefined : hm
    if (t === 'CHECK_OUT') checkOut = hm === '—' ? undefined : hm
  }
  const wh = r.working_hours ?? r.workingHours
  let totalHours: string | undefined
  if (wh != null && wh !== '') {
    const mins = Math.round(Number(wh) * 60)
    totalHours = `${Math.floor(mins / 60)}h ${mins % 60}m`
  }
  const statusKey = String(r.status ?? '').toUpperCase()
  return {
    id: String(r.id ?? ''),
    date: String(r.attendance_date ?? r.date ?? ''),
    checkIn,
    checkOut,
    totalHours,
    status: (BACKEND_ATTENDANCE_STATUS_TO_UI[statusKey] ?? 'Present') as AttendanceRecord['status'],
    note: typeof r.note === 'string' ? r.note : undefined,
  }
}

export async function getMyWorkTodayInfo(): Promise<{ todayLabel: string; shift: string }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      todayLabel?: string
      shift?: string
      today_label?: string
    }>('/my-work/attendance/today-info')
    return {
      todayLabel: data.todayLabel ?? data.today_label ?? 'Today',
      shift: data.shift ?? '—',
    }
  }
  await delay()
  return { todayLabel: currentUser.todayLabel, shift: currentUser.shift }
}

/** Weekly hour bars for the attendance chart. */
export async function getMyWeekHours(): Promise<WeekHourBar[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<unknown>('/my-work/attendance/week-hours')
    return mapWeekHoursPayload(data)
  }
  await delay()
  return weekHours.map((w) => ({ ...w }))
}

/** Real check-in / check-out punch. Server owns the attendance_day row. */
export async function punchAttendance(input: {
  employmentId: number
  punchType: 'CHECK_IN' | 'CHECK_OUT'
}): Promise<{ id?: number; dayId?: number }> {
  const { data } = await apiClient.post<Record<string, unknown>>(
    '/my-work/attendance/punch',
    {
      employment_id: input.employmentId,
      punch_type: input.punchType,
    },
  )
  const dayId = data.attendance_day_id ?? data.day_id ?? data.dayId
  return {
    id: typeof data.id === 'number' ? data.id : undefined,
    dayId: typeof dayId === 'number' ? dayId : undefined,
  }
}

/** Today's attendance day id (needed to open a server-side break). */
export async function getMyTodayDayId(): Promise<number | null> {
  const { data } = await apiClient.get<Record<string, unknown>>(
    '/my-work/attendance/today-info',
  )
  const dayId = data.dayId ?? data.day_id ?? data.attendance_day_id
  return typeof dayId === 'number' ? dayId : null
}

const BREAK_SERVER_ID_KEY = 'bytevon.breakServerIds'

function readBreakServerIds(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(BREAK_SERVER_ID_KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

/** Open a server-side break; remembers the server id for the local break id. */
export async function syncBreakStartToServer(
  localId: string,
  attendanceDayId: number,
): Promise<number | null> {
  try {
    const { data } = await apiClient.post<Record<string, unknown>>(
      '/my-work/attendance/breaks/start',
      { attendance_day_id: attendanceDayId },
    )
    if (typeof data.id === 'number') {
      const map = readBreakServerIds()
      map[localId] = data.id
      localStorage.setItem(BREAK_SERVER_ID_KEY, JSON.stringify(map))
      return data.id
    }
  } catch {
    /* best-effort: local timer remains source of truth */
  }
  return null
}

/** Close the server-side break linked to a local break id. */
export async function syncBreakEndToServer(localId: string): Promise<void> {
  try {
    const map = readBreakServerIds()
    const serverId = map[localId]
    if (serverId == null) return
    await apiClient.post(`/my-work/attendance/breaks/${serverId}/end`, {})
    delete map[localId]
    localStorage.setItem(BREAK_SERVER_ID_KEY, JSON.stringify(map))
  } catch {
    /* best-effort */
  }
}

/** Backend day status → UI display status. */
function mapDayStatus(status: unknown): AttendanceRecord['status'] {
  const key = String(status ?? '').toUpperCase()
  switch (key) {
    case 'PRESENT':
      return 'Present'
    case 'ABSENT':
      return 'Absent'
    case 'HALF_DAY':
    case 'HALF':
      return 'Half Day'
    case 'ON_LEAVE':
      return 'On Leave'
    case 'HOLIDAY':
      return 'Holiday'
    case 'WEEK_OFF':
      return 'Weekend'
    default:
      return 'Absent'
  }
}

export async function listCorrectionCandidates(): Promise<AttendanceRecord[]> {
  if (env.useMockApi) {
    await delay()
    return attendanceHistory
      .filter((r) => r.status === 'Half Day' || r.status === 'Absent' || Boolean(r.note))
      .map((r) => ({ ...r }))
  }
  // Backend returns [{ attendanceDayId, date, status, label }]; normalize to UI rows.
  const { data } = await apiClient.get<
    Array<{ attendanceDayId?: number; id?: number | string; date?: string; status?: string }>
  >('/my-work/attendance/correction-candidates')
  return (Array.isArray(data) ? data : []).map((c, i) => ({
    id: String(c.attendanceDayId ?? c.id ?? `${c.date ?? i}`),
    date: String(c.date ?? ''),
    status: mapDayStatus(c.status),
  }))
}

/** "09:00 AM" + "2026-09-21" → ISO datetime for the correction API. */
function combineDateTime(date: string, time: string): string | null {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/)
  if (!m || !date) return null
  let hh = Number(m[1])
  const mm = m[2]
  const mer = (m[3] ?? '').toUpperCase()
  if (mer === 'PM' && hh < 12) hh += 12
  if (mer === 'AM' && hh === 12) hh = 0
  return `${date}T${String(hh).padStart(2, '0')}:${mm}:00`
}

export type SubmitCorrectionInput = Omit<
  AttendanceCorrectionRequest,
  'id' | 'submittedOn' | 'status'
> & { attendanceDayId?: number | string }

export async function listMyTasks(params: MyWorkListParams = {}): Promise<MyTaskListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items?: Array<Record<string, unknown>>
      total?: number
    }>('/my-work/tasks', { params })
    const raw = Array.isArray(data) ? data : (data.items ?? [])
    const items = (Array.isArray(raw) ? raw : []).map(mapApiMyTask)
    return {
      items,
      total: Array.isArray(data) ? items.length : Number((data as { total?: number }).total ?? items.length),
      page,
      pageSize,
    }
  }

  await delay()
  let items = myTasks.map((t) => ({ ...t })) as MyTask[]
  if (params.status && params.status !== 'All') {
    items = items.filter((t) => t.status === params.status)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.project ?? '').toLowerCase().includes(q),
    )
  }
  const sliced = paginateItems(items, page, pageSize)
  return { ...sliced, page, pageSize }
}

/** Single task for the detail page — backend exposes list only, so resolve by id. */
export async function getMyTask(taskId: string): Promise<MyTask> {
  const { items } = await listMyTasks({ pageSize: 200 })
  const task = items.find((t) => String(t.id) === String(taskId))
  if (!task) throw new Error('Task not found')
  return task
}

export interface MyProjectOption {
  id: number
  name: string
  status: string
}

/** Active projects assigned to me or to one of my teams. */
export async function listMyProjects(): Promise<MyProjectOption[]> {
  if (env.useMockApi) {
    await delay()
    return []
  }
  const { data } = await apiClient.get<MyProjectOption[]>('/my-work/tasks/projects')
  return Array.isArray(data) ? data : []
}

export interface CreateMyTaskInput {
  projectId: number
  title: string
  description?: string | null
  priority: string
  startDate?: string | null
  dueDate?: string | null
  estimatedHours?: number | null
}

/** Self-assign task create — assignee is always the caller (server-enforced). */
export async function createMyTask(input: CreateMyTaskInput): Promise<Record<string, unknown>> {
  if (env.useMockApi) {
    await delay(400)
    return { id: `T-${Date.now()}`, ...input }
  }
  const { data } = await apiClient.post<Record<string, unknown>>('/my-work/tasks', {
    project_id: input.projectId,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority,
    start_date: input.startDate ?? null,
    due_date: input.dueDate ?? null,
    estimated_hours: input.estimatedHours ?? null,
  })
  return data
}

export async function listMyApprovals(
  params: MyWorkListParams = {},
): Promise<ApprovalListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<{
      items?: Array<Record<string, unknown>>
      total?: number
    }>('/my-work/approvals', { params })
    const raw = Array.isArray(data) ? data : (data.items ?? [])
    const items = (Array.isArray(raw) ? raw : []).map(mapApiMyApproval)
    return {
      items,
      total: Array.isArray(data) ? items.length : Number((data as { total?: number }).total ?? items.length),
      page,
      pageSize,
    }
  }

  await delay()
  // Mock fallback
  let items = myApprovals.map((a) => ({ ...a })) as ApprovalRequest[]
  if (params.status && params.status !== 'All') {
    items = items.filter((a) => a.status === params.status)
  }
  const sliced = paginateItems(items, page, pageSize)
  return { ...sliced, page, pageSize }
}

/** Backend my-work approval row → UI ApprovalRequest. */
const APPROVAL_TYPE_TO_UI: Record<string, 'Leave' | 'Attendance Correction' | 'Expense' | 'Other'> = {
  LEAVE_REQUEST: 'Leave',
  ATTENDANCE_CORRECTION: 'Attendance Correction',
  EXPENSE: 'Expense',
  NEW_HIRE: 'Other',
}

function mapApiMyApproval(r: Record<string, unknown>): ApprovalRequest {
  const rawStatus = String(r.status ?? 'Pending')
  const status = (['Pending', 'Approved', 'Rejected', 'Cancelled'] as const).includes(
    rawStatus as 'Pending' | 'Approved' | 'Rejected' | 'Cancelled',
  )
    ? (rawStatus as ApprovalRequest['status'])
    : 'Pending'
  const title = String(r.title ?? r.request_reason ?? '').trim()
  const summaryRaw = String(r.summary ?? r.request_reason ?? '').trim()
  const typeKey = String(r.request_type ?? '').toUpperCase()
  const requesterRaw = String(r.requester ?? '').trim()
  return {
    id: String(r.id ?? ''),
    type: APPROVAL_TYPE_TO_UI[typeKey] ?? 'Other',
    title: title || `${typeKey} #${String(r.reference_id ?? r.id ?? '')}`,
    submittedOn: String(r.submitted_on ?? r.submittedOn ?? ''),
    status,
    summary: summaryRaw || undefined,
    requester: requesterRaw && !/^emp #/i.test(requesterRaw) ? requesterRaw : undefined,
  }
}

export async function listMySubmittedRequests(
  params: MyWorkListParams = {},
): Promise<{ items: ApprovalRow[]; total: number }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: ApprovalRow[]; total: number }>(
      '/my-work/requests',
      { params },
    )
    return data
  }

  await delay()
  // Mock fallback derived from the approvals seed (no dedicated mock store).
  let items: ApprovalRow[] = myApprovals.map((a, i) => ({
    id: String(a.id ?? `APR-${i}`),
    type: String(a.type ?? 'Leave'),
    typeIcon: 'approval',
    typeColor: 'secondary',
    requester: 'You',
    requesterInitials: 'YO',
    date: String(a.submittedOn ?? ''),
    priority: 'Normal',
    status: (['Pending', 'Approved', 'Rejected'] as const).includes(
      a.status as 'Pending' | 'Approved' | 'Rejected',
    )
      ? (a.status as 'Pending' | 'Approved' | 'Rejected')
      : 'Pending',
  }))
  if (params.status && params.status !== 'All') {
    items = items.filter(
      (r) => r.status === params.status || (params.status === 'In-Progress' && r.status === 'Pending'),
    )
  }
  return { items, total: items.length }
}

export async function listAttendanceCorrections(
  params: MyWorkListParams = {},
): Promise<CorrectionListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<CorrectionListResponse>(
      '/my-work/attendance/corrections',
      { params },
    )
    return data
  }

  await delay()
  let items = correctionRequestsSeed.map((c) => ({ ...c })) as AttendanceCorrectionRequest[]
  if (params.status) {
    items = items.filter((r) => r.status === params.status)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (r) =>
        r.date.includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.originalStatus.toLowerCase().includes(q) ||
        r.approver.toLowerCase().includes(q),
    )
  }
  const sliced = paginateItems(items, page, pageSize)
  return { ...sliced, page, pageSize }
}

export async function submitAttendanceCorrection(
  body: SubmitCorrectionInput & { date?: string },
): Promise<AttendanceCorrectionRequest> {
  if (env.useMockApi) {
    await delay()
    return {
      ...body,
      id: `corr-${Date.now()}`,
      status: 'Pending',
      submittedOn: new Date().toISOString().slice(0, 10),
    }
  }
  // Canonical route is POST /workforce/attendance/corrections (my-work has no POST).
  const dayId = Number((body as { attendanceDayId?: unknown }).attendanceDayId)
  if (!Number.isFinite(dayId)) throw new Error('Select an attendance day for the correction')
  const date = typeof body.date === 'string' ? body.date : ''
  const targetDepartmentId = Number(
    (body as { targetDepartmentId?: unknown }).targetDepartmentId,
  )
  const { data } = await apiClient.post<{ id?: number; status?: string }>(
    '/workforce/attendance/corrections',
    {
      attendance_day_id: dayId,
      requested_check_in: combineDateTime(date, String(body.requestedCheckIn ?? '')),
      requested_check_out: combineDateTime(date, String(body.requestedCheckOut ?? '')),
      reason: body.reason,
      ...(Number.isFinite(targetDepartmentId) ? { target_department_id: targetDepartmentId } : {}),
    },
  )
  const status = String(data.status ?? 'PENDING').toUpperCase()
  return {
    ...body,
    id: `corr-${data.id ?? Date.now()}`,
    status: status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Pending',
    submittedOn: new Date().toISOString().slice(0, 10),
  }
}

/**
 * Manual attendance entry (Mark Attendance → Request Approval).
 * Resolves the caller's day for the date; when none exists the backend
 * auto-creates it (attendance_date fallback) and files the correction,
 * which raises an approval request to the department head.
 */
export async function submitManualAttendance(input: {
  date: string
  timeIn?: string
  timeOut?: string
  reason: string
  employmentId: number
  targetDepartmentId?: number
}): Promise<{ id: number | null }> {
  const requestedIn = combineDateTime(input.date, String(input.timeIn ?? ''))
  const requestedOut = combineDateTime(input.date, String(input.timeOut ?? ''))
  if (!requestedIn && !requestedOut) {
    throw new Error('Enter at least a time-in or time-out for the manual entry')
  }
  let dayId: number | null = null
  try {
    const { data } = await apiClient.get<Array<{ id?: number }>>(
      `/workforce/attendance/days/by-employment/${input.employmentId}`,
      { params: { from_date: input.date, to_date: input.date } },
    )
    const hit = Array.isArray(data) ? data[0] : undefined
    if (hit && typeof hit.id === 'number') dayId = hit.id
  } catch {
    dayId = null
  }
  const { data } = await apiClient.post<{ id?: number }>(
    '/workforce/attendance/corrections',
    {
      ...(dayId != null ? { attendance_day_id: dayId } : { attendance_date: input.date }),
      requested_check_in: requestedIn,
      requested_check_out: requestedOut,
      reason: input.reason,
      ...(input.targetDepartmentId != null
        ? { target_department_id: input.targetDepartmentId }
        : {}),
    },
  )
  return { id: typeof data.id === 'number' ? data.id : null }
}

export async function submitLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
  if (env.useMockApi) {
    await delay(400)
    const holidayDates = new Set(holidaysSeed.map((h) => h.date))
    const days = mockCountWorkingDays(
      input.from,
      input.to,
      Boolean(input.halfDay),
      holidayDates,
    )
    return {
      id: `LV-${Date.now()}`,
      type: mapLeaveTypeToUI(input.type) as LeaveRequest['type'],
      from: input.from,
      to: input.to,
      days,
      reason: input.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().slice(0, 10),
      approver: '—',
      halfDay: input.halfDay ? 'start' : null,
    }
  }
  const { data } = await apiClient.post<Record<string, unknown>>('/my-work/leave', {
    type: input.type,
    from_date: input.from,
    to_date: input.to,
    reason: input.reason,
    half_day: input.halfDay ? 'start' : null,
  })
  return mapApiLeaveRequest(data)
}

export async function listApproverDirectory(): Promise<ApproverOption[]> {
  if (env.useMockApi) {
    await delay()
    return approverDirectory.map((a) => ({ ...a }))
  }
  const { data } = await apiClient.get<
    Array<Record<string, unknown>>
  >('/my-work/approvers')
  // Backend shape: { employmentId, name, role, departmentId? } → UI shape.
  return (Array.isArray(data) ? data : []).map((r) => {
    const employmentId = Number(r.employmentId ?? r.employment_id)
    return {
      id: Number.isFinite(employmentId) ? `emp-${employmentId}` : String(r.id ?? r.name ?? ''),
      name: String(r.name ?? ''),
      title: String(r.role ?? r.title ?? 'Approver'),
      departmentId:
        r.departmentId != null || r.department_id != null
          ? Number(r.departmentId ?? r.department_id)
          : undefined,
      employmentId: Number.isFinite(employmentId) ? employmentId : undefined,
    }
  })
}

export const fetchHolidays = async (): Promise<Record<string, string>> => {
  if (env.useMockApi) {
    await delay()
    return Object.fromEntries(holidaysSeed.map((holiday) => [holiday.date, holiday.name]))
  }

  // No standalone self-scope holiday endpoint exists; the leave apply-context
  // carries the year's holidays for the employee's calendar.
  const ctx = await getApplyLeaveContext()
  return Object.fromEntries(
    (ctx.holidays ?? [])
      .filter((h) => typeof h?.date === 'string')
      .map((h) => [h.date, String(h.name ?? '')]),
  )
}

/** Request cancellation of an approved leave — backend POST /leave/requests/{id}/request-cancel. */
export async function requestLeaveCancel(id: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    return
  }
  await apiClient.post(`/leave/requests/${encodeURIComponent(id)}/request-cancel`)
}
