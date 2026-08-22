export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Critical'
export type NotificationStatus = 'Unread' | 'Read' | 'Archived'
export type DeliveryChannel = 'In-App' | 'Email' | 'SMS' | 'Push'
export type DeliveryStatus = 'Delivered' | 'Pending' | 'Failed'

export type NotificationTabId = 'all' | 'unread' | 'mentions' | 'high' | 'archived'

export interface NotificationTab {
  id: NotificationTabId
  label: string
}

export interface NotificationKpi {
  id: string
  label: string
  value: string
  hint: string
  hintTone: 'positive' | 'danger' | 'neutral'
  icon: string
}

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
  /** Route path for Open related record */
  relatedHref?: string
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

export interface SentKpi {
  id: string
  label: string
  value: string
  hint: string
  icon: string
  danger?: boolean
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

export interface ChannelCard {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
}

export interface ComposeNotificationInput {
  title: string
  body: string
  priority: NotificationPriority
  moduleCtx: string
  broadcastAll: boolean
  roles: string[]
  channels: { inApp: boolean; email: boolean; sms: boolean; push: boolean }
  scheduleMode: 'now' | 'later'
  attachmentNames?: string[]
}

export interface ComposeDeliveryResult {
  queued: number
  sentRows: SentNotificationRow[]
}
