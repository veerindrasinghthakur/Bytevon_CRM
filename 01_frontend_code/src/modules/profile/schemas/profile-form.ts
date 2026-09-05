import { z } from 'zod'
import type { ProfileDetail, ProfileUpdateInput } from './profile'

/** Editable profile fields only — used with RHF + zodResolver (no transform). */
export const profileEditFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string(),
  location: z.string(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
  preferences: z.object({
    emailNotifications: z.boolean(),
    desktopPush: z.boolean(),
    language: z.string(),
    appearance: z.enum(['light', 'dark', 'system']),
  }),
})

export type ProfileEditFormInput = z.infer<typeof profileEditFormSchema>

/** @deprecated Prefer profileEditFormSchema for RHF; kept for compatibility. */
export const profileFormSchema = profileEditFormSchema
export type ProfileFormInput = ProfileEditFormInput

export const emptyProfileForm = (): ProfileEditFormInput => ({
  name: '',
  phone: '',
  location: '',
  dateOfBirth: '',
  timezone: '',
  preferences: {
    emailNotifications: true,
    desktopPush: true,
    language: 'en',
    appearance: 'system',
  },
})

/** Map ProfileDetail → form defaults when entering edit mode. */
export function profileToFormValues(profile: ProfileDetail): ProfileEditFormInput {
  return {
    name: profile.name ?? '',
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    timezone: profile.timezone ?? '',
    preferences: {
      emailNotifications: profile.preferences?.emailNotifications ?? true,
      desktopPush: profile.preferences?.desktopPush ?? true,
      language: profile.preferences?.language ?? 'en',
      appearance: profile.preferences?.appearance ?? 'system',
    },
  }
}

/** Form → API update payload. */
export function toProfileUpdateInput(form: ProfileEditFormInput): ProfileUpdateInput {
  return {
    name: form.name?.trim(),
    phone: form.phone?.trim(),
    location: form.location?.trim(),
    dateOfBirth: form.dateOfBirth?.trim() || undefined,
    timezone: form.timezone?.trim() || undefined,
    preferences: {
      emailNotifications: form.preferences.emailNotifications,
      desktopPush: form.preferences.desktopPush,
      language: form.preferences.language,
      appearance: form.preferences.appearance,
    },
  }
}
