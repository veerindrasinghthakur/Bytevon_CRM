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
import { lazyPage } from '@/shared/lib/lazyPage'

const NotificationCenterPage = lazyPage(
  () => import('./pages/NotificationCenterPage'),
  'NotificationCenterPage',
)
const ComposeNotificationPage = lazyPage(
  () => import('./pages/ComposeNotificationPage'),
  'ComposeNotificationPage',
)
const SentNotificationsPage = lazyPage(
  () => import('./pages/SentNotificationsPage'),
  'SentNotificationsPage',
)
const NotificationSettingsPage = lazyPage(
  () => import('./pages/NotificationSettingsPage'),
  'NotificationSettingsPage',
)
const NotificationDetailPage = lazyPage(
  () => import('./pages/NotificationDetailPage'),
  'NotificationDetailPage',
)

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
