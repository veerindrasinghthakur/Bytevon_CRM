export type {
  NotificationPriority,
  NotificationStatus,
  NotificationTabId,
  AppNotification,
  NotificationKpi,
  NotificationTab,
} from '../schemas/notification'

export type { NotificationListResponse } from '../schemas/notification-list-response'

import type { NotificationTabId } from '../schemas/notification'

export interface InboxListParams {
  search?: string
  tab?: NotificationTabId
  typeFilter?: string
  priorityFilter?: string
  moduleFilter?: string
  page?: number
  pageSize?: number
  /** Data-boundary hint; backend enforces from auth token. */
  scope?: string
}
