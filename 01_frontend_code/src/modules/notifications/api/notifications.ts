/** Compatibility barrel — prefer domain api/* files. */
export {
  computeInboxKpis,
  listInboxNotifications,
  listAllInboxNotifications,
  getNotification,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  archiveReadNotifications,
} from './center'
export { computeSentKpis, listSentNotifications } from './sent'
export type { SentListParams } from './sent'
export { sendNotification, saveNotificationDraft } from './compose'
export { listNotificationTriggers, listChannelCards } from './settings'
