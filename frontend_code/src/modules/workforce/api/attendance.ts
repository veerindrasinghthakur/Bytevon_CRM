/**
 * Workforce attendance API — org dashboard, today list, detail, day detail.
 * env.useMockApi → shared/mock seed; false → /workforce/attendance/*
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
} from '@/shared/mock/data/workforce'

export type AttendanceKpi = (typeof seedKpis)[number]
export type WeeklyAttendancePoint = (typeof seedWeekly)[number]
export type RecentCheckIn = (typeof seedRecent)[number]
export type TodayAttendanceRow = (typeof seedToday)[number]
export type CorrectionRow = (typeof seedCorrections)[number]
export type AttendanceLogRow = (typeof seedLogs)[number]

export interface AttendanceDashboardData {
  kpis: AttendanceKpi[]
  weekly: WeeklyAttendancePoint[]
  recentCheckIns: RecentCheckIn[]
  today: TodayAttendanceRow[]
  corrections: CorrectionRow[]
}

export interface AttendanceDetailData {
  row: TodayAttendanceRow
  logs: AttendanceLogRow[]
}

export interface AttendanceDayDetailData {
  employmentId: string
  date: string
  punches: Array<{
    id: number
    punch_type: string
    punch_time: string
    is_valid_punch: boolean
    client_ip: string
    validation_message: string | null
  }>
  breaks: Array<{ id: number; start: string; end: string; duration_min: number }>
  workingHours: number
}

export async function getAttendanceDashboard(): Promise<AttendanceDashboardData> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<AttendanceDashboardData>('/workforce/attendance/dashboard')
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
        `/workforce/attendance/${attendanceId}`,
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
      `/workforce/attendance/day/${employmentId}`,
      { params: { date } },
    )
    return data
  }
  await delay()
  return {
    employmentId,
    date,
    punches: [
      {
        id: 1,
        punch_type: 'CHECK_IN',
        punch_time: '09:32:14',
        is_valid_punch: true,
        client_ip: '203.0.113.42',
        validation_message: null,
      },
      {
        id: 2,
        punch_type: 'CHECK_OUT',
        punch_time: '18:41:02',
        is_valid_punch: true,
        client_ip: '203.0.113.42',
        validation_message: null,
      },
    ],
    breaks: [{ id: 1, start: '13:05', end: '13:45', duration_min: 40 }],
    workingHours: 8.2,
  }
}

export async function listAttendanceCorrections(): Promise<CorrectionRow[]> {
  if (!env.useMockApi) {
    const { data } = await apiClient.get<{ items: CorrectionRow[] }>(
      '/workforce/attendance/corrections',
    )
    return data.items ?? []
  }
  await delay()
  return seedCorrections.map((c) => ({ ...c }))
}
