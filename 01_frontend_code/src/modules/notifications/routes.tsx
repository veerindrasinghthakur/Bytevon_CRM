/**
 * Notification module routes — import and spread into the app router tree.
 */
import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const NotificationCenterPage = lazyPage(
  () => import('./pages/center/NotificationCenterPage'),
  'NotificationCenterPage',
)
const ComposeNotificationPage = lazyPage(
  () => import('./pages/compose/ComposeNotificationPage'),
  'ComposeNotificationPage',
)
const SentNotificationsPage = lazyPage(
  () => import('./pages/sent/SentNotificationsPage'),
  'SentNotificationsPage',
)
const NotificationSettingsPage = lazyPage(
  () => import('./pages/settings/NotificationSettingsPage'),
  'NotificationSettingsPage',
)
const NotificationDetailPage = lazyPage(
  () => import('./pages/center/NotificationDetailPage'),
  'NotificationDetailPage',
)

export const notificationRoutes = {
  center: '/notifications',
  compose: '/notifications/compose',
  sent: '/notifications/sent',
  settings: '/notifications/settings',
  detailPath: '/notifications/$notificationId',
  detail: (notificationId: string) => `/notifications/${notificationId}`,
} as const

export function createNotificationRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications',
      component: NotificationCenterPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/compose',
      component: ComposeNotificationPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/sent',
      component: SentNotificationsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/settings',
      component: NotificationSettingsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/$notificationId',
      component: NotificationDetailPage,
    }),
  ]
}
