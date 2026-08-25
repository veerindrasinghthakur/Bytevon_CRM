import { z } from 'zod'

export const organizationProfileSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  legal: z.string().max(160).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tax: z.string().max(40).optional().or(z.literal('')),
  reg: z.string().max(40).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})

export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>

export const attendanceSettingsSchema = z.object({
  shiftStart: z.string().min(1),
  shiftEnd: z.string().min(1),
  graceMinutes: z.coerce.number().int().min(0).max(180),
  earlyOutMinutes: z.coerce.number().int().min(0).max(180),
  otMinMinutes: z.coerce.number().int().min(0).max(480),
  allowRemoteCheckIn: z.boolean(),
})

export type AttendanceSettingsInput = z.infer<typeof attendanceSettingsSchema>
