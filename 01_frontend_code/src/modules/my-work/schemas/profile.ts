import { z } from 'zod'

export const appearancePreferenceSchema = z.enum(['light', 'dark', 'system'])
export type AppearancePreference = z.infer<typeof appearancePreferenceSchema>

export const profilePreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  desktopPush: z.boolean(),
  language: z.string(),
  appearance: appearancePreferenceSchema,
})
export type ProfilePreferences = z.infer<typeof profilePreferencesSchema>

export const profileDetailSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string(),
  location: z.string(),
  dateOfBirth: z.string(),
  timezone: z.string(),
  role: z.string(),
  department: z.string(),
  jobTitle: z.string(),
  reportingManager: z.string(),
  joiningDate: z.string(),
  workType: z.string(),
  employmentId: z.number(),
  personId: z.number(),
  avatarUrl: z.string().nullable(),
  orgMail: z.string(),
  lastLoginAt: z.string(),
  lastLoginIp: z.string(),
  preferences: profilePreferencesSchema,
})
export type ProfileDetail = z.infer<typeof profileDetailSchema>

export const profileSessionSchema = z.object({
  id: z.number(),
  device_name: z.string(),
  device_type: z.string(),
  ip_address: z.string(),
  status: z.string(),
  last_used_at: z.string(),
  current: z.boolean().optional(),
})
export type ProfileSession = z.infer<typeof profileSessionSchema>

export const profileActivityItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  module: z.string(),
  time: z.string(),
  status: z.string(),
  icon: z.string(),
})
export type ProfileActivityItem = z.infer<typeof profileActivityItemSchema>

export const profileUpdateInputSchema = profileDetailSchema.partial()
export type ProfileUpdateInput = z.infer<typeof profileUpdateInputSchema>

export const profileListResponseSchema = z.object({
  items: z.array(profileDetailSchema),
  total: z.number(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
})
export type ProfileListResponse = z.infer<typeof profileListResponseSchema>
