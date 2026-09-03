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

export const organizationSettingsSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  head_office_location_id: z.number().int().positive('Select a head office location'),
  default_timezone: z.string().min(1, 'Timezone is required'),
  default_currency: z.string().min(1, 'Currency is required'),
})

export type OrganizationSettingsForm = z.infer<typeof organizationSettingsSchema>

export const brandingSchema = z.object({
  primaryColor: z.string().default('var(--color-primary)'),
  secondaryColor: z.string().default('var(--color-secondary)'),
})

export type BrandingForm = z.infer<typeof brandingSchema>

export const regionalSchema = z.object({
  defaultLanguage: z.string().default('English (US)'),
  defaultTimezone: z.string().default('UTC-05:00 Eastern Time'),
  defaultCurrency: z.string().default('USD ($)'),
  dateFormat: z.string().default('MM/DD/YYYY'),
  numberFormat: z.string().default('1,234.56'),
  firstDayOfWeek: z.string().default('Sunday'),
})

export type RegionalForm = z.infer<typeof regionalSchema>
