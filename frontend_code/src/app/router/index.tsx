import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '@/app/layouts/AppShell'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { loadStoredSession } from '@/modules/auth/api/auth'
import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SessionExpiredPage,
  AccessDeniedPage,
  NotFoundPage,
} from '@/modules/auth'

import { createDashboardRoutes } from '@/modules/dashboard/routes'
import { createProfileRoutes } from '@/modules/profile/routes'
import { createNotificationRoutes } from '@/modules/notifications/routes'
import { createMyWorkRoutes } from '@/modules/my-work/routes'
import { createApprovalRoutes } from '@/modules/approvals/routes'
import { createSalesRoutes } from '@/modules/sales/routes'
import { createProjectsRoutes } from '@/modules/projects/routes'
import { createPayrollRoutes } from '@/modules/payroll/routes'
import {
  createOrganizationSettingsRoutes,
  createWorkforceShiftRoutes,
} from '@/modules/organization/routes'
import { createWorkforceRoutes } from '@/modules/workforce/routes'
import {
  createAdminRoutes,
  createAdminSettingsLayoutRoute,
  createAdminSettingsCoreRoutes,
} from '@/modules/admin/routes'

function requireAuth() {
  const session = loadStoredSession()
  if (!session) {
    throw redirect({ to: '/login', search: { redirect: window.location.pathname } })
  }
}

function requireGuest() {
  const session = loadStoredSession()
  if (session) {
    throw redirect({ to: '/dashboard' })
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
})

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  beforeLoad: () => {
    requireGuest()
  },
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  beforeLoad: () => {
    requireGuest()
  },
  component: ForgotPasswordPage,
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
})

const sessionExpiredRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/session-expired',
  component: SessionExpiredPage,
})

const accessDeniedRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/access-denied',
  component: AccessDeniedPage,
})

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: () => {
    requireAuth()
  },
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const session = loadStoredSession()
    throw redirect({ to: session ? '/dashboard' : '/login' })
  },
})

const adminSettingsLayoutRoute = createAdminSettingsLayoutRoute(appLayoutRoute)

const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    sessionExpiredRoute,
    accessDeniedRoute,
  ]),
  appLayoutRoute.addChildren([
    ...createDashboardRoutes(appLayoutRoute),
    ...createProfileRoutes(appLayoutRoute),
    ...createNotificationRoutes(appLayoutRoute),
    ...createMyWorkRoutes(appLayoutRoute),
    ...createApprovalRoutes(appLayoutRoute),
    ...createSalesRoutes(appLayoutRoute),
    ...createProjectsRoutes(appLayoutRoute),
    ...createPayrollRoutes(appLayoutRoute),
    ...createWorkforceRoutes(appLayoutRoute),
    ...createWorkforceShiftRoutes(appLayoutRoute),
    ...createAdminRoutes(appLayoutRoute),
    adminSettingsLayoutRoute.addChildren([
      ...createAdminSettingsCoreRoutes(adminSettingsLayoutRoute),
      ...createOrganizationSettingsRoutes(adminSettingsLayoutRoute),
    ]),
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
