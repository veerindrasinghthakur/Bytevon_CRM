import { z } from 'zod'
import { leaveBalanceSchema } from './leave'
import { myTaskSchema } from './task'
import { weekHourBarSchema } from './attendance'

export const metricCardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  subtitle: z.string().optional(),
  icon: z.string(),
  changeType: z.enum(['positive', 'negative', 'neutral']).optional(),
})
export type MetricCard = z.infer<typeof metricCardSchema>

export const notificationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  time: z.string(),
  unread: z.boolean(),
  icon: z.string(),
  tag: z.string().optional(),
})
export type NotificationItem = z.infer<typeof notificationItemSchema>

export const upcomingEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  month: z.string(),
  day: z.string(),
  icon: z.string(),
})
export type UpcomingEvent = z.infer<typeof upcomingEventSchema>

export const myWorkUserSchema = z.object({
  name: z.string(),
  employeeId: z.string(),
  department: z.string(),
  role: z.string().optional(),
  todayLabel: z.string(),
  shift: z.string(),
})
export type MyWorkUser = z.infer<typeof myWorkUserSchema>

export const myWorkOverviewSchema = z.object({
  user: myWorkUserSchema,
  metrics: z.array(metricCardSchema),
  todayAttendance: z.object({
    checkIn: z.string(),
    checkInNote: z.string(),
    totalHours: z.string(),
    totalHoursNote: z.string(),
  }),
  weekHours: z.array(weekHourBarSchema),
  leaveBalances: z.array(leaveBalanceSchema),
  tasks: z.array(myTaskSchema),
  notifications: z.array(notificationItemSchema),
  events: z.array(upcomingEventSchema),
  quickActions: z.array(
    z.object({
      icon: z.string(),
      label: z.string(),
      to: z.string(),
    }),
  ),
})
export type MyWorkOverview = z.infer<typeof myWorkOverviewSchema>
