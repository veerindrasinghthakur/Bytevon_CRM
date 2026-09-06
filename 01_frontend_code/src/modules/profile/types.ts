/** @deprecated Prefer `@/modules/my-work/types` for profile types */
export type {
  AppearancePreference,
  ProfilePreferences,
  ProfileDetail,
  ProfileSession,
  ProfileActivityItem,
  ProfileUpdateInput,
  ProfileListResponse,
  ProfileFormInput,
  ProfileEditFormInput,
} from '@/modules/my-work/types'

export {
  profileFormSchema,
  profileEditFormSchema,
  emptyProfileForm,
  profileToFormValues,
  toProfileUpdateInput,
  PROFILE_LANG_OPTIONS,
  APPEARANCE_OPTIONS,
  sessionStatusStyles,
  sessionStatusClass,
} from '@/modules/my-work/types'
