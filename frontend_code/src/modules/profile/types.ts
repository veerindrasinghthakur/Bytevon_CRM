/** Re-export domain types from Zod schemas — MODULE_STANDARDS. */

export type {
  AppearancePreference,
  ProfilePreferences,
  ProfileDetail,
  ProfileSession,
  ProfileActivityItem,
  ProfileUpdateInput,
  ProfileListResponse,
} from './schemas/profile'

export type { ProfileFormInput } from './schemas/profile-form'

export {
  profileFormSchema,
  emptyProfileForm,
  toProfileUpdateInput,
} from './schemas/profile-form'

export {
  PROFILE_LANG_OPTIONS,
  APPEARANCE_OPTIONS,
  sessionStatusStyles,
  sessionStatusClass,
} from './schemas/enums'
