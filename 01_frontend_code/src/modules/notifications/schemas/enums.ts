/** Notification module constants / style maps — semantic tokens only. */

import type { NotificationPriority } from './notification'
import type { DeliveryStatus } from './sent'

/** Priority picker dots (Compose) */
export const priorityDotClass: Record<NotificationPriority, string> = {
  Low: 'bg-secondary',
  Normal: 'bg-secondary',
  High: 'bg-[var(--color-warning-amber)]',
  Critical: 'bg-error',
}

/** Inbox / overview status dots */
export function notificationStatusDotClass(
  priority: NotificationPriority,
  status: string,
): string {
  if (priority === 'Critical' || priority === 'High') return 'bg-error'
  if (status === 'Unread') return 'bg-secondary'
  return 'bg-outline'
}

/** Sent delivery status pills */
export const deliveryStatusStyles: Record<
  DeliveryStatus,
  { pill: string; dot: string }
> = {
  Delivered: { pill: 'status-badge status-success', dot: 'bg-secondary' },
  Pending: { pill: 'status-badge status-info', dot: 'bg-secondary' },
  Failed: { pill: 'status-badge status-error', dot: 'bg-error' },
}

export const COMPOSE_ROLE_SUGGESTIONS = [
  'Management',
  'IT Support',
  'HR Admin',
  'Finance',
  'Engineering',
  'All Managers',
  'Super Admin',
] as const

export const COMPOSE_MODULE_OPTIONS = [
  { value: 'General / System', label: 'General / System' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Finance & Payroll', label: 'Finance & Payroll' },
  { value: 'Security & Compliance', label: 'Security & Compliance' },
  { value: 'Facility Management', label: 'Facility Management' },
] as const

export const PRIORITY_OPTIONS: NotificationPriority[] = ['Low', 'Normal', 'High', 'Critical']
