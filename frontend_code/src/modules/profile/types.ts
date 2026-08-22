/** Profile module types — mirror auth user + employment projection. */

export type AppearancePreference = 'light' | 'dark' | 'system'

export interface ProfilePreferences {
  emailNotifications: boolean
  desktopPush: boolean
  language: string
  appearance: AppearancePreference
}

export interface ProfileDetail {
  id: number
  username: string
  email: string
  name: string
  phone: string
  location: string
  dateOfBirth: string
  timezone: string
  role: string
  department: string
  jobTitle: string
  reportingManager: string
  joiningDate: string
  workType: string
  employmentId: number
  personId: number
  avatarUrl: string | null
  orgMail: string
  lastLoginAt: string
  lastLoginIp: string
  preferences: ProfilePreferences
}

export interface ProfileSession {
  id: number
  device_name: string
  device_type: string
  ip_address: string
  status: string
  last_used_at: string
  current?: boolean
}

export interface ProfileActivityItem {
  id: number
  title: string
  module: string
  time: string
  status: string
  icon: string
}

export type ProfileUpdateInput = Partial<
  Pick<
    ProfileDetail,
    | 'name'
    | 'phone'
    | 'location'
    | 'dateOfBirth'
    | 'timezone'
    | 'preferences'
  >
>
