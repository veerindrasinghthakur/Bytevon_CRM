/**
 * Notification module routes — import and spread into the app router tree.
 */
import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { requirePermission, requireView } from '@/shared/rbac/require-permission'

/** Variable grant: any notification VIEW opens the center; data is scope-filtered server-side. */
const requireNotificationView = () => requireView('notification')
/** Compose needs the CREATE action — at whatever scope the user holds. */
const requireNotificationCreate = () =>
  requirePermission({ action: 'CREATE', resource: 'notification' })

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
const TemplatesListPage = lazyPage(
  () => import('./pages/template/TemplatesListPage'),
  'TemplatesListPage',
)
const NotificationPreferencesPage = lazyPage(
  () => import('./pages/preference/NotificationPreferencesPage'),
  'NotificationPreferencesPage',
)

export const notificationRoutes = {
  center: '/notifications',
  compose: '/notifications/compose',
  sent: '/notifications/sent',
  settings: '/notifications/settings',
  templates: '/notifications/templates',
  preferences: '/notifications/preferences',
  detailPath: '/notifications/$notificationId',
  detail: (notificationId: string) => `/notifications/${notificationId}`,
} as const

export function createNotificationRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications',
      beforeLoad: requireNotificationView,
      component: NotificationCenterPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/compose',
      beforeLoad: requireNotificationCreate,
      component: ComposeNotificationPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/sent',
      beforeLoad: requireNotificationView,
      component: SentNotificationsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/settings',
      beforeLoad: requireNotificationView,
      component: NotificationSettingsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/$notificationId',
      beforeLoad: requireNotificationView,
      component: NotificationDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/templates',
      beforeLoad: requireNotificationView,
      component: TemplatesListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/notifications/preferences',
      beforeLoad: requireNotificationView,
      component: NotificationPreferencesPage,
    }),
  ]
}
