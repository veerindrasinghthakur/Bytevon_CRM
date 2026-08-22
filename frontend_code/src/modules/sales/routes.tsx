import { createRoute, redirect } from '@tanstack/react-router'
import { SalesDashboardPage } from './pages/SalesDashboardPage'
import { LeadsListPage } from './pages/LeadsListPage'
import { LeadCreatePage } from './pages/LeadCreatePage'
import { LeadDetailPage } from './pages/LeadDetailPage'
import { ClientsListPage } from './pages/ClientsListPage'
import { ClientCreatePage } from './pages/ClientCreatePage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { SalesAnalyticsPage } from './pages/SalesAnalyticsPage'
import { SalesActivityTimelinePage } from './pages/SalesActivityTimelinePage'
import { CaseStudiesListPage } from './pages/CaseStudiesListPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSalesRoutes(appLayoutRoute: any) {
  return [
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales', component: LeadsListPage }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/dashboard',
      component: SalesDashboardPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/leads',
      beforeLoad: () => {
        throw redirect({ to: '/sales' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/leads/new',
      component: LeadCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/leads/$leadId',
      component: LeadDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/leads/$leadId/edit',
      component: LeadCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/clients',
      component: ClientsListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/clients/new',
      component: ClientCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/clients/$clientId',
      component: ClientDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/analytics',
      component: SalesAnalyticsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/activity',
      component: SalesActivityTimelinePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/case-studies',
      component: CaseStudiesListPage,
    }),
  ]
}
