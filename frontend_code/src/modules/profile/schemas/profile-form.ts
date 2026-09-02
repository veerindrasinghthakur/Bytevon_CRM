import { z } from 'zod'
import { profileDetailSchema, type ProfileUpdateInput } from './profile'

const profilePreferencesFormSchema = z.object({
  emailNotifications: z.boolean(),
  desktopPush: z.boolean(),
  language: z.string().default('en'),
  appearance: z.enum(['light', 'dark', 'system']).default('system'),
})

// Form state uses strings for all inputs (controlled components)
// Maps to ProfileUpdateInput on submit
export const profileFormSchema = profileDetailSchema
  .extend({
    dateOfBirth: z.string().optional().or(z.literal('')),
    timezone: z.string().optional().or(z.literal('')),
    preferences: profilePreferencesFormSchema.optional(),
  })
  .transform((data) => ({
    ...data,
    dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth) : undefined,
    timezone: data.timezone ? String(data.timezone) : undefined,
    preferences: data.preferences
      ? {
          emailNotifications: Boolean(data.preferences.emailNotifications),
          desktopPush: Boolean(data.preferences.desktopPush),
          language: data.preferences.language ?? 'en',
          appearance: data.preferences.appearance ?? 'system',
        }
      : undefined,
  }))

export type ProfileFormInput = z.infer<typeof profileFormSchema>

export const emptyProfileForm = (): ProfileFormInput => ({
  id: 0,
  username: '',
  email: '',
  name: '',
  phone: '',
  location: '',
  dateOfBirth: '',
  timezone: '',
  role: '',
  department: '',
  jobTitle: '',
  reportingManager: '',
  joiningDate: '',
  workType: '',
  employmentId: 0,
  personId: 0,
  avatarUrl: null,
  orgMail: '',
  lastLoginAt: '',
  lastLoginIp: '',
  preferences: {
    emailNotifications: true,
    desktopPush: true,
    language: 'en',
    appearance: 'system',
  },
})

/** Form → API update payload (string dates → proper types, preferences object). */
export function toProfileUpdateInput(form: ProfileFormInput): ProfileUpdateInput {
  const preferences = form.preferences
    ? {
        emailNotifications: form.preferences.emailNotifications,
        desktopPush: form.preferences.desktopPush,
        language: form.preferences.language,
        appearance: form.preferences.appearance,
      }
    : undefined

  return {
    name: form.name?.trim(),
    phone: form.phone?.trim(),
    location: form.location?.trim(),
    dateOfBirth: form.dateOfBirth?.trim() || undefined,
    timezone: form.timezone?.trim() || undefined,
    preferences,
  }
}
