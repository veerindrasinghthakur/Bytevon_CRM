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

export async function getAttendanceDashboard(): Promise<AttendanceDashboardData> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<AttendanceDashboardData>('/attendance/dashboard')
    return data
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


