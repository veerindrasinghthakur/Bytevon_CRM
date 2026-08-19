/**
 * Notification module routes — import and spread into the app router tree.
 * Paths:
 *   /notifications
 *   /notifications/compose
 *   /notifications/sent
 *   /notifications/settings
 *   /notifications/$notificationId
 */
import { createRoute } from '@tanstack/react-router'
import { NotificationCenterPage } from './pages/NotificationCenterPage'
import { ComposeNotificationPage } from './pages/ComposeNotificationPage'
import { SentNotificationsPage } from './pages/SentNotificationsPage'
import { NotificationSettingsPage } from './pages/NotificationSettingsPage'
import { NotificationDetailPage } from './pages/NotificationDetailPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createNotificationRoutes(appLayoutRoute: any) {
  const notificationsRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/notifications',
    component: NotificationCenterPage,
  })
  const notificationsComposeRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/notifications/compose',
    component: ComposeNotificationPage,
  })
  const notificationsSentRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/notifications/sent',
    component: SentNotificationsPage,
  })
  const notificationsSettingsRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/notifications/settings',
    component: NotificationSettingsPage,
  })
  const notificationDetailRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/notifications/$notificationId',
    component: NotificationDetailPage,
  })
  return [
    notificationsRoute,
    notificationsComposeRoute,
    notificationsSentRoute,
    notificationsSettingsRoute,
    notificationDetailRoute,
  ]
}
