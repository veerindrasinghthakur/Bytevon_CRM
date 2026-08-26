/** Re-export domain types from Zod schemas — MODULE_STANDARDS (my-work pattern). */

export type {
  AppearancePreference,
  ProfilePreferences,
  ProfileDetail,
  ProfileSession,
  ProfileActivityItem,
  ProfileUpdateInput,
} from './schemas/profile'

export {
  profileFormSchema,
  emptyProfileForm,
  toProfileUpdateInput,
} from './schemas/profile-form'