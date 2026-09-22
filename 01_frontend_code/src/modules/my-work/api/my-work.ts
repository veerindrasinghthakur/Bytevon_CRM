/**
 * My Work module API — self-service attendance, leave, tasks, approvals.
 * Server-side pagination/filtering (MODULE_STANDARDS §4).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { LeaveType, leaveTypeLabel } from '@/shared/schema/enums'
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
      const todayIso = new Date().toISOString().slice(0, 10)
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
      department: String(rawUser.department ?? ''),
      role: typeof rawUser.role === 'string' ? (rawUser.role as string) : undefined,
      todayLabel: String(rawUser.todayLabel ?? 'Today'),
      shift: String(rawUser.shift ?? '—'),
    },
    metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
    todayAttendance: {
      checkIn: typeof rawToday?.checkIn === 'string' ? (rawToday.checkIn as string) : '—',
      checkInNote: typeof rawToday?.status === 'string' ? (rawToday.status as string) : '',
      totalHours:
        rawToday && (rawToday.checkIn || rawToday.checkOut)
          ? `${hours}h ${mins}m`
          : '—',
      totalHoursNote:
        rawToday?.breakMinutes != null ? `Break ${String(rawToday.breakMinutes)}m` : '',
    },
    weekHours: mapWeekHoursPayload(raw.weekHours),
    leaveBalances: Array.isArray(raw.leaveBalances) ? raw.leaveBalances : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
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
    const { data } = await apiClient.get<LeaveListResponse>('/my-work/leave', { params })
    return data
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
    const { data } = await apiClient.get<LeaveBalance[]>('/my-work/leave/balances')
    return data
  }
  await delay()
  return leaveBalances.map((b) => ({ ...b }))
}

export async function listLeaveTypeOptions(): Promise<LeaveTypeOption[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<LeaveTypeOption[]>('/my-work/leave/types')
    return data
  }
  await delay()
  // Mock fallback derived from shared LeaveType enum (single source of truth).
  return (Object.values(LeaveType) as string[]).map((value) => ({
    value,
    label: leaveTypeLabel(value),
    requires_approval: true,
  }))
}

export async function getApplyLeaveContext(): Promise<ApplyLeaveContext> {
  if (env.useMockApi) {
    await delay()
    return {
      holidays: [],
      leaveTypes: (Object.values(LeaveType) as string[]).map((value) => ({
        value,
        label: leaveTypeLabel(value),
        requires_approval: true,
      })),
      balances: leaveBalances.map((b) => ({ ...b })),
    }
  }
  const { data } = await apiClient.get<ApplyLeaveContext>('/my-work/leave/apply-context')
  return data
}

export async function calculateLeaveDays(
  input: LeaveCalculateInput,
): Promise<LeaveCalculateResult> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<LeaveCalculateResult>('/my-work/leave/calculate', input)
    return data
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
  params: MyWorkListParams = {},
): Promise<AttendanceListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<
      AttendanceListResponse | unknown[] | { items?: unknown[]; total?: number }
    >('/my-work/attendance', { params })
    if (Array.isArray(data)) {
      return { items: data as AttendanceRecord[], total: data.length, page, pageSize }
    }
    const items = ((data as { items?: AttendanceRecord[] }).items ?? []) as AttendanceRecord[]
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
    const { data } = await apiClient.get<MyTaskListResponse>('/my-work/tasks', { params })
    return data
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

export async function listMyApprovals(
  params: MyWorkListParams = {},
): Promise<ApprovalListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<ApprovalListResponse>('/my-work/approvals', { params })
    return data
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
  const { data } = await apiClient.post<{ id?: number; status?: string }>(
    '/workforce/attendance/corrections',
    {
      attendance_day_id: dayId,
      requested_check_in: combineDateTime(date, String(body.requestedCheckIn ?? '')),
      requested_check_out: combineDateTime(date, String(body.requestedCheckOut ?? '')),
      reason: body.reason,
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
      type: input.type,
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
  const { data } = await apiClient.post<LeaveRequest>('/my-work/leave', input)
  return data
}

export async function listApproverDirectory(): Promise<ApproverOption[]> {
  if (env.useMockApi) {
    await delay()
    return approverDirectory.map((a) => ({ ...a }))
  }
  const { data } = await apiClient.get<ApproverOption[]>('/my-work/approvers')
  return data
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
