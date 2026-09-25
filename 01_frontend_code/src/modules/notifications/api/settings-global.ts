/**
 * Global notification settings — real GET/PUT /notifications/settings.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'

export interface GlobalTrigger {
  id: string
  event: string
  description: string
  in_app: boolean
  email: boolean
  enabled: boolean
}

export interface GlobalChannel {
  id: string
  name: string
  enabled: boolean
}

export interface GlobalSettings {
  channels: GlobalChannel[]
  triggers: GlobalTrigger[]
  batch: { frequency: string }
  quiet: { enabled: boolean; start: string; end: string }
  exemptions: string[]
}

const MOCK_DEFAULTS: GlobalSettings = {
  channels: [
    { id: 'in_app', name: 'In-App', enabled: true },
    { id: 'email', name: 'Email', enabled: true },
  ],
  triggers: [
    { id: 'leave_submitted', event: 'Leave submitted', description: 'Employee submits a leave request', in_app: true, email: true, enabled: true },
    { id: 'leave_decision', event: 'Leave decision', description: 'Leave request approved or rejected', in_app: true, email: true, enabled: true },
    { id: 'attendance_submitted', event: 'Attendance correction submitted', description: 'Employee submits an attendance correction', in_app: true, email: false, enabled: true },
    { id: 'attendance_decision', event: 'Attendance decision', description: 'Attendance correction approved or rejected', in_app: true, email: true, enabled: true },
    { id: 'payroll_paid', event: 'Payroll paid', description: 'Monthly payroll marked paid', in_app: true, email: true, enabled: true },
  ],
  batch: { frequency: 'hourly' },
  quiet: { enabled: true, start: '21:00', end: '07:00' },
  exemptions: ['Security Alerts', 'System Down'],
}

let mockStore: GlobalSettings | null = null

export async function getGlobalSettings(): Promise<GlobalSettings> {
  if (env.useMockApi) {
    await delay(150)
    if (!mockStore) mockStore = structuredClone(MOCK_DEFAULTS)
    return structuredClone(mockStore)
  }
  const { data } = await apiClient.get<GlobalSettings>('/notifications/settings')
  return data
}

export async function updateGlobalSettings(patch: Partial<GlobalSettings>): Promise<GlobalSettings> {
  if (env.useMockApi) {
    await delay(200)
    if (!mockStore) mockStore = structuredClone(MOCK_DEFAULTS)
    mockStore = { ...mockStore, ...patch }
    return structuredClone(mockStore)
  }
  const { data } = await apiClient.put<GlobalSettings>('/notifications/settings', patch)
  return data
}
