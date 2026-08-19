export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Critical'
export type NotificationStatus = 'Unread' | 'Read' | 'Archived'
export type DeliveryChannel = 'In-App' | 'Email' | 'SMS' | 'Push'
export type DeliveryStatus = 'Delivered' | 'Pending' | 'Failed'

export interface AppNotification {
  id: string
  title: string
  body: string
  module: string
  priority: NotificationPriority
  status: NotificationStatus
  timeAgo: string
  createdAt: string
  icon: string
  tags?: string[]
  actor?: string
  employeeId?: string
  /** Detail fields */
  note?: string
  meta?: { label: string; value: string }[]
  timeline?: { title: string; time: string; detail: string; active?: boolean }[]
}

export interface SentNotificationRow {
  id: string
  recipientName: string
  recipientContact: string
  initials?: string
  title: string
  preview: string
  status: DeliveryStatus
  type: DeliveryChannel
  sentAt: string
}

export interface NotificationTrigger {
  id: string
  event: string
  description: string
  channels: DeliveryChannel[]
  recipients: string
  lastTriggered: string
  enabled: boolean
}
