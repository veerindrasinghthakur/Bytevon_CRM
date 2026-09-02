import { DeviceType, SessionStatus } from '@/shared/schema'
import type {
  ProfileActivityItem,
  ProfileDetail,
  ProfileSession,
} from '@/modules/profile/types'

export const mockProfile: ProfileDetail = {
  id: 1,
  username: 'admin',
  email: 'admin@bytevon.example',
  name: 'Admin User',
  phone: '+1 (555) 012-3456',
  location: 'San Francisco, CA',
  dateOfBirth: 'May 12, 1985',
  timezone: 'Pacific Time (PT)',
  role: 'Administrator',
  department: 'HR Operations',
  jobTitle: 'Administrator',
  reportingManager: 'Sarah Jenkins (VP Ops)',
  joiningDate: 'January 15, 2018',
  workType: 'Hybrid (HQ / Remote)',
  employmentId: 1,
  personId: 1,
  avatarUrl: null,
  orgMail: 'admin@bytevon.example',
  lastLoginAt: 'Today, 10:45 AM',
  lastLoginIp: '192.168.1.1',
  preferences: {
    emailNotifications: true,
    desktopPush: true,
    language: 'en',
    appearance: 'system',
  },
}

/** Mutable session store — simulates DB sessions table */
export let mockSessions: ProfileSession[] = [
  {
    id: 1,
    device_name: 'MacBook Pro · Chrome',
    device_type: DeviceType.DESKTOP,
    ip_address: '203.0.113.10',
    status: SessionStatus.ACTIVE,
    last_used_at: '2026-08-22 14:22',
    current: true,
  },
  {
    id: 2,
    device_name: 'iPhone 15 · Safari',
    device_type: DeviceType.MOBILE,
    ip_address: '198.51.100.22',
    status: SessionStatus.ACTIVE,
    last_used_at: '2026-08-21 09:10',
  },
  {
    id: 3,
    device_name: 'Office PC · Edge',
    device_type: DeviceType.DESKTOP,
    ip_address: '203.0.113.88',
    status: SessionStatus.REVOKED,
    last_used_at: '2026-08-10 18:00',
  },
]

export function replaceMockSessions(next: ProfileSession[]) {
  mockSessions = next
}

export const mockActivity: ProfileActivityItem[] = [
  {
    id: 1,
    title: 'Updated onboarding workflow for Engineering Dept',
    module: 'ERP / Workflows',
    time: 'Today, 10:45 AM',
    status: 'COMPLETED',
    icon: 'edit_note',
  },
  {
    id: 2,
    title: 'Approved 4 new employee records',
    module: 'HR Management',
    time: 'Yesterday, 4:20 PM',
    status: 'COMPLETED',
    icon: 'person_add',
  },
  {
    id: 3,
    title: 'Password rotation triggered',
    module: 'Security',
    time: 'Oct 24, 2023, 9:15 AM',
    status: 'AUTOMATED',
    icon: 'key',
  },
  {
    id: 4,
    title: 'Exported Q3 Payroll Report',
    module: 'Finance / Reports',
    time: 'Oct 22, 2023, 2:50 PM',
    status: 'COMPLETED',
    icon: 'file_download',
  },
]

/** In-memory mutable profile for mock updates */
let profileStore: ProfileDetail = { ...mockProfile, preferences: { ...mockProfile.preferences } }

export function getProfileStore(): ProfileDetail {
  return profileStore
}

export function setProfileStore(next: ProfileDetail) {
  profileStore = next
}
