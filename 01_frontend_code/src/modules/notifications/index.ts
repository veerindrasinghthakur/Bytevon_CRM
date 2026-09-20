export { NotificationCenterPage } from './pages/center/NotificationCenterPage'
export { NotificationDetailPage } from './pages/center/NotificationDetailPage'
export { ComposeNotificationPage } from './pages/compose/ComposeNotificationPage'
export { SentNotificationsPage } from './pages/sent/SentNotificationsPage'
export { NotificationSettingsPage } from './pages/settings/NotificationSettingsPage'
export { TemplatesListPage } from './pages/template/TemplatesListPage'
export { NotificationPreferencesPage } from './pages/preference/NotificationPreferencesPage'
export { createNotificationRoutes, notificationRoutes } from './routes'

export * from './api/notifications'
export { useNotificationCenter } from './hooks/center/use-notification-center'
export { useSentNotifications } from './hooks/sent/use-sent-notifications'
export { useNotificationSettings } from './hooks/settings/use-notification-settings'
export { useTemplates, useTemplate } from './hooks/template/use-templates'
export { usePreferences } from './hooks/preference/use-preferences'
export {
  useNotificationDetail,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from './hooks/center/use-notifications'
