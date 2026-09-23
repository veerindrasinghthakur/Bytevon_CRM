/**
 * Workforce attendance API — org dashboard, today list, detail, day detail.
 * env.useMockApi → shared/mock seed; false → /attendance/*
 */

import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import {
  attendanceKpis as seedKpis,
  weeklyAttendance as seedWeekly,
  recentCheckIns as seedRecent,
  todayAttendance as seedToday,
  corrections as seedCorrections,
  attendanceLogs as seedLogs,
  attendanceDayDetailSeed,
} from '@/shared/mock/data/workforce'
import type {
  AttendanceDashboardData,
  AttendanceDayDetailData,
  AttendanceDetailData,
  CorrectionRow,
  TodayAttendanceRow,
} from '../types'

export async function getAttendanceDashboard(params?: {
  employment_id?: number
  from_date?: string
  to_date?: string
  year?: number
  month?: number
}): Promise<AttendanceDashboardData> {
  if (!env.useMockApi) {
    // Scope-based aggregate (SELF default, drill-down via employment_id).
    const { data } = await apiClient.get<{
      totals?: { present?: number; absent?: number; half?: number; onLeave?: number }
      rates?: { attendancePct?: number }
      hours?: { worked?: number }
      week?: Array<{ date?: string; status?: string; minutes?: number }>
      corrections?: { pending?: number; total?: number }
    }>('/dashboard/attendance', { params })
    const totals = data.totals ?? {}
    const week = Array.isArray(data.week) ? data.week : []
    return {
      kpis: [
        { key: 'present', label: 'Present', value: Number(totals.present ?? 0), hint: '', icon: 'check_circle' },
        { key: 'absent', label: 'Absent', value: Number(totals.absent ?? 0), hint: '', icon: 'cancel' },
        { key: 'attendancePct', label: 'Attendance %', value: Number(data.rates?.attendancePct ?? 0), hint: '', icon: 'percent' },
        { key: 'worked', label: 'Hours worked', value: Number(data.hours?.worked ?? 0), hint: '', icon: 'schedule' },
      ],
      weekly: week.map((d) => ({
        day: String(d.date ?? ''),
        thisWeek: d.status === 'PRESENT' ? 1 : 0,
        lastWeek: 0,
      })),
      recentCheckIns: [],
      today: [],
      corrections: [],
    } as unknown as AttendanceDashboardData
  }
  await delay()
  return {
    kpis: [...seedKpis],
    weekly: [...seedWeekly],
    recentCheckIns: [...seedRecent],
    today: seedToday.map((r) => ({ ...r })),
    corrections: seedCorrections.map((c) => ({ ...c })),
  }
}

export async function listTodayAttendance(params?: {
  search?: string
  status?: string
}): Promise<{ items: TodayAttendanceRow[]; total: number }> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: TodayAttendanceRow[]; total: number }>(
      '/workforce/attendance/today',
      { params },
    )
    return data
  }
  await delay()
  let items = seedToday.map((r) => ({ ...r }))
  if (params?.search) {
    const q = params.search.toLowerCase()
    items = items.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q),
    )
  }
  if (params?.status && params.status !== 'ALL' && params.status !== 'all') {
    items = items.filter((r) => r.status === params.status)
  }
  return { items, total: items.length }
}

export async function getAttendanceById(attendanceId: string): Promise<AttendanceDetailData | null> {
  if (!env.useMockApi) {
    try {
      const { data } = await apiClient.get<AttendanceDetailData>(
        `/workforce/attendance/days/${attendanceId}`,
      )
      return data
    } catch {
      return null
    }
  }
  await delay()
  const row = seedToday.find((r) => r.id === attendanceId) ?? seedToday[0]
  if (!row) return null
  return { row: { ...row }, logs: seedLogs.map((l) => ({ ...l })) }
}

export async function getAttendanceDayDetail(
  employmentId: string,
  date: string,
): Promise<AttendanceDayDetailData> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<AttendanceDayDetailData>(
      `/workforce/attendance/days/by-employment/${employmentId}`,
      { params: { date } },
    )
    return data
  }
  await delay()
  return {
    employmentId,
    date,
    punches: attendanceDayDetailSeed.punches.map((punch) => ({ ...punch })),
    breaks: attendanceDayDetailSeed.breaks.map((item) => ({ ...item })),
    workingHours: attendanceDayDetailSeed.workingHours,
  }
}

export async function listAttendanceCorrections(): Promise<CorrectionRow[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: CorrectionRow[] }>(
      '/attendance/corrections',
    )
    return data.items ?? []
  }
  await delay()
  return seedCorrections.map((c) => ({ ...c }))
}

export interface AttendanceDayRow {
  id: number
  employment_id: number
  shift_id: number | null
  attendance_date: string
  status: string
  working_hours: number | null
}

/** Org-wide day rows in [from_date, to_date] (backend range endpoint). */
export async function listDaysInRange(
  fromDate: string,
  toDate: string,
): Promise<AttendanceDayRow[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<Array<Record<string, unknown>>>(
      '/workforce/attendance/days/by-date-range',
      { params: { from_date: fromDate, to_date: toDate } },
    )
    return (Array.isArray(data) ? data : []).map((r) => ({
      id: Number(r.id),
      employment_id: Number(r.employment_id),
      shift_id: r.shift_id != null ? Number(r.shift_id) : null,
      attendance_date: String(r.attendance_date ?? '').slice(0, 10),
      status: String(r.status ?? ''),
      working_hours: r.working_hours != null ? Number(r.working_hours) : null,
    }))
  }
  await delay()
  // Mock: project today's seed rows onto the requested dates.
  const days: string[] = []
  for (let d = new Date(`${fromDate}T00:00:00`); d <= new Date(`${toDate}T00:00:00`); d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10))
  }
  return days.flatMap((day, di) =>
    seedToday.map((r, i) => ({
      id: di * 100 + i + 1,
      employment_id: i + 1,
      shift_id: null,
      attendance_date: day,
      status: r.status,
      working_hours: r.hours && r.hours !== '—' ? Number.parseFloat(r.hours) || null : null,
    })),
  )
}

export interface PendingCorrection {
  id: number
  attendance_day_id: number
  employment_id: number | null
  employment_name: string | null
  attendance_date: string | null
  requested_check_in: string | null
  requested_check_out: string | null
  reason: string
  approval_request_id: number | null
  status: string
  created_at: string
}

/** Org-wide pending corrections (backend pending endpoint). */
export async function listPendingCorrections(): Promise<PendingCorrection[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<Array<Record<string, unknown>>>(
      '/workforce/attendance/corrections/pending',
    )
    return (Array.isArray(data) ? data : []).map((r) => ({
      id: Number(r.id),
      attendance_day_id: Number(r.attendance_day_id),
      employment_id: r.employment_id != null ? Number(r.employment_id) : null,
      employment_name: (r.employment_name as string | undefined) ?? null,
      attendance_date: r.attendance_date ? String(r.attendance_date).slice(0, 10) : null,
      requested_check_in: (r.requested_check_in as string | undefined) ?? null,
      requested_check_out: (r.requested_check_out as string | undefined) ?? null,
      reason: String(r.reason ?? ''),
      approval_request_id:
        r.approval_request_id != null ? Number(r.approval_request_id) : null,
      status: String(r.status ?? ''),
      created_at: String(r.created_at ?? ''),
    }))
  }
  await delay()
  return seedCorrections.map((c, i) => ({
    id: Number(c.id.replace(/\D/g, '')) || i + 1,
    attendance_day_id: i + 1,
    employment_id: i + 1,
    employment_name: c.name,
    attendance_date: null,
    requested_check_in: null,
    requested_check_out: null,
    reason: c.note,
    approval_request_id: null,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  }))
}

/** Approve / reject a correction via its linked approval request. */
export async function decideCorrection(
  approvalRequestId: number,
  decision: 'approve' | 'reject',
): Promise<void> {
  if (!env.useMockApi) {
    await apiClient.post(`/approvals/${approvalRequestId}/${decision}`, {})
    return
  }
  await delay(300)
}


