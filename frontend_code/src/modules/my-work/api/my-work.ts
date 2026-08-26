/**
 * My Work module API — self-service attendance, leave, tasks, approvals.
 * Server-side pagination/filtering (MODULE_STANDARDS §4).
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE, paginateItems } from '@/shared/lib/list-params'
import {
  attendanceHistory,
  currentUser,
  leaveBalances,
  leaveRequests,
  myApprovals,
  myTasks,
  myWorkMetrics,
  myWorkQuickActions,
  recentNotifications,
  todayAttendance,
  upcomingEvents,
  weekHours,
  correctionRequestsSeed,
  leaveTypeOptions,
  approverDirectory,
} from '@/shared/mock/data/my-work'
import type {
  ApprovalListResponse,
  ApprovalRequest,
  AttendanceListResponse,
  AttendanceRecord,
  CorrectionListResponse,
  AttendanceCorrectionRequest,
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveListResponse,
  LeaveRequest,
  LeaveTypeOption,
  MyTask,
  MyTaskListResponse,
  MyWorkOverview,
  ApproverOption,
} from '../types'

export interface MyWorkListParams {
  search?: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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
  return data
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
  let items = leaveRequests.map((r) => ({ ...r }))
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
  if (env.useMockApi) {
    await delay()
    return leaveBalances.map((b) => ({ ...b }))
  }
  const { data } = await apiClient.get<LeaveBalance[]>('/my-work/leave/balances')
  return data
}

export async function listLeaveTypeOptions(): Promise<LeaveTypeOption[]> {
  if (env.useMockApi) {
    await delay()
    return leaveTypeOptions.map((o) => ({ ...o }))
  }
  const { data } = await apiClient.get<LeaveTypeOption[]>('/my-work/leave/types')
  return data
}

export async function listMyAttendance(
  params: MyWorkListParams = {},
): Promise<AttendanceListResponse> {
  const page = params.page ?? DEFAULT_LIST_PAGE
  const pageSize = params.pageSize ?? DEFAULT_LIST_PAGE_SIZE

  if (!env.useMockApi) {
    const { data } = await apiClient.get<AttendanceListResponse>('/my-work/attendance', { params })
    return data
  }

  await delay()
  let items = attendanceHistory.map((r) => ({ ...r })) as AttendanceRecord[]
  if (params.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (r) =>
        r.date.includes(q) ||
        (r.status ?? '').toLowerCase().includes(q) ||
        (r.note ?? '').toLowerCase().includes(q),
    )
  }
  if (params.status && params.status !== 'All') {
    items = items.filter((r) => r.status === params.status)
  }
  const sliced = paginateItems(items, page, pageSize)
  return { ...sliced, page, pageSize }
}

/** Attendance rows eligible for correction requests (half day / absent / noted). */
export async function listCorrectionCandidates(): Promise<AttendanceRecord[]> {
  if (env.useMockApi) {
    await delay()
    return attendanceHistory
      .filter((r) => r.status === 'Half Day' || r.status === 'Absent' || Boolean(r.note))
      .map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<AttendanceRecord[]>('/my-work/attendance/correction-candidates')
  return data
}

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
  let items = myApprovals.map((a) => ({ ...a })) as ApprovalRequest[]
  if (params.status && params.status !== 'All') {
    items = items.filter((a) => a.status === params.status)
  }
  const sliced = paginateItems(items, page, pageSize)
  return { ...sliced, page, pageSize }
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
  body: Omit<AttendanceCorrectionRequest, 'id' | 'submittedOn' | 'status'>,
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
  const { data } = await apiClient.post<AttendanceCorrectionRequest>(
    '/my-work/attendance/corrections',
    body,
  )
  return data
}

export async function submitLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
  if (env.useMockApi) {
    await delay(400)
    return {
      id: `LV-${Date.now()}`,
      type: input.type,
      from: input.from,
      to: input.to,
      days: 1,
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

// Fetch holidays from the mock backend (or API in the future)
export const fetchHolidays = async (): Promise<Record<string, string>> => {
  const response = await fetch('http://localhost:8001/api/holidays')
  if (!response.ok) {
    throw new Error('Failed to fetch holidays')
  }
  return response.json()
}
