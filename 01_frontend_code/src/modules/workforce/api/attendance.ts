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
      '/attendance/today',
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
        `/attendance/days/${attendanceId}`,
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
      `/attendance/days/by-employment/${employmentId}`,
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


