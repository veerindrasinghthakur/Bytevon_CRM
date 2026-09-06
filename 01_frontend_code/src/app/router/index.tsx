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
import { NotFoundPage } from '@/modules/auth'
import { createAuthRoutes, authRoutes } from '@/modules/auth/routes'
import { safeRedirectOpts } from '@/shared/lib/safeNavigate'

import { createDashboardRoutes, dashboardRoutes } from '@/modules/dashboard/routes'
import { createNotificationRoutes } from '@/modules/notifications/routes'
import { createMyWorkRoutes } from '@/modules/my-work/routes'
import { createApprovalRoutes } from '@/modules/approvals/routes'
import { createSalesRoutes } from '@/modules/sales/routes'
import { createProjectsRoutes } from '@/modules/projects/routes'
import { createPayrollRoutes } from '@/modules/payroll/routes'
import { createWorkforceRoutes } from '@/modules/workforce/routes'
import {
  createAdminRoutes,
  createAdminSettingsLayoutRoute,
  createAdminSettingsCoreRoutes,
  createWorkforceShiftRoutes,
} from '@/modules/admin/routes'

function requireAuth() {
  const session = loadStoredSession()
  if (!session) {
    throw redirect(
      safeRedirectOpts({
        to: authRoutes.login,
        search: { redirect: window.location.pathname },
      }),
    )
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
    throw redirect(safeRedirectOpts({ to: dashboardRoutes.root }))
  },
})

const adminSettingsLayoutRoute = createAdminSettingsLayoutRoute(appLayoutRoute)

const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([...createAuthRoutes(authLayoutRoute)]),
  appLayoutRoute.addChildren([
    ...createDashboardRoutes(appLayoutRoute),
    // Profile is registered inside createMyWorkRoutes (/profile/* URLs unchanged)
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
