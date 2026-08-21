/**
 * My Work module API — self-service attendance, leave, tasks, requests.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
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
} from '../data/mock'
import type {
  ApprovalRequest,
  AttendanceRecord,
  LeaveBalance,
  LeaveRequest,
  MetricCard,
  MyTask,
  NotificationItem,
  UpcomingEvent,
} from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getMyWorkOverview() {
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
  const { data } = await apiClient.get('/my-work/overview')
  return data as {
    user: typeof currentUser
    metrics: MetricCard[]
    todayAttendance: typeof todayAttendance
    weekHours: typeof weekHours
    leaveBalances: LeaveBalance[]
    tasks: MyTask[]
    notifications: NotificationItem[]
    events: UpcomingEvent[]
    quickActions: typeof myWorkQuickActions
  }
}

export async function listMyLeaveRequests(params?: {
  status?: string
}): Promise<LeaveRequest[]> {
  if (env.useMockApi) {
    await delay()
    let items = leaveRequests.map((r) => ({ ...r }))
    if (params?.status && params.status !== 'All') {
      items = items.filter((r) => r.status === params.status)
    }
    return items
  }
  const { data } = await apiClient.get<LeaveRequest[]>('/my-work/leave', { params })
  return data
}

export async function listMyLeaveBalances(): Promise<LeaveBalance[]> {
  if (env.useMockApi) {
    await delay()
    return leaveBalances.map((b) => ({ ...b }))
  }
  const { data } = await apiClient.get<LeaveBalance[]>('/my-work/leave/balances')
  return data
}

export async function listMyAttendance(params?: {
  search?: string
}): Promise<AttendanceRecord[]> {
  if (env.useMockApi) {
    await delay()
    let items = attendanceHistory.map((r) => ({ ...r }))
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (r) =>
          r.date.includes(q) ||
          (r.status ?? '').toLowerCase().includes(q) ||
          (r.note ?? '').toLowerCase().includes(q),
      )
    }
    return items
  }
  const { data } = await apiClient.get<AttendanceRecord[]>('/my-work/attendance', { params })
  return data
}

export async function listMyTasks(params?: {
  status?: string
  search?: string
}): Promise<MyTask[]> {
  if (env.useMockApi) {
    await delay()
    let items = myTasks.map((t) => ({ ...t }))
    if (params?.status && params.status !== 'All') {
      items = items.filter((t) => t.status === params.status)
    }
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (t) => t.name.toLowerCase().includes(q) || t.project.toLowerCase().includes(q),
      )
    }
    return items
  }
  const { data } = await apiClient.get<MyTask[]>('/my-work/tasks', { params })
  return data
}

export async function listMyApprovals(params?: {
  status?: string
}): Promise<ApprovalRequest[]> {
  if (env.useMockApi) {
    await delay()
    let items = myApprovals.map((a) => ({ ...a }))
    if (params?.status && params.status !== 'All') {
      items = items.filter((a) => a.status === params.status)
    }
    return items
  }
  const { data } = await apiClient.get<ApprovalRequest[]>('/my-work/approvals', { params })
  return data
}

export async function submitLeaveRequest(input: {
  type: string
  from: string
  to: string
  reason: string
}): Promise<LeaveRequest> {
  if (env.useMockApi) {
    await delay(400)
    return {
      id: `LV-${Date.now()}`,
      type: input.type as LeaveRequest['type'],
      from: input.from,
      to: input.to,
      days: 1,
      reason: input.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().slice(0, 10),
      approver: '—',
    }
  }
  const { data } = await apiClient.post<LeaveRequest>('/my-work/leave', input)
  return data
}
