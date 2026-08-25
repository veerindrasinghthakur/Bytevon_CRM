import { z } from 'zod'

export const attendanceStatusSchema = z.enum([
  'Present',
  'Absent',
  'Half Day',
  'On Leave',
  'Holiday',
  'Weekend',
])
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>

export const attendanceRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  totalHours: z.string().optional(),
  status: attendanceStatusSchema,
  shift: z.string().optional(),
  note: z.string().optional(),
})
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>

export const correctionStatusSchema = z.enum(['Pending', 'Approved', 'Rejected', 'Draft'])
export type CorrectionStatus = z.infer<typeof correctionStatusSchema>

export const attendanceCorrectionSchema = z.object({
  id: z.string(),
  date: z.string(),
  originalStatus: z.string(),
  requestedCheckIn: z.string(),
  requestedCheckOut: z.string(),
  reason: z.string(),
  status: correctionStatusSchema,
  submittedOn: z.string(),
  approver: z.string(),
  approverId: z.string().optional(),
})
export type AttendanceCorrectionRequest = z.infer<typeof attendanceCorrectionSchema>

export const breakBarMarkerSchema = z.object({
  id: z.string(),
  startPct: z.number(),
  endPct: z.number().optional(),
})
export type BreakBarMarker = z.infer<typeof breakBarMarkerSchema>

export const weekHourBarSchema = z.object({
  day: z.string(),
  hours: z.number(),
  pct: z.number(),
  isToday: z.boolean(),
  isWeekend: z.boolean(),
  breakMarkers: z.array(breakBarMarkerSchema).optional(),
})
export type WeekHourBar = z.infer<typeof weekHourBarSchema>
