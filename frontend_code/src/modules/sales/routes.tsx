import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const SalesDashboardPage = lazyPage(() => import('./pages/SalesDashboardPage'), 'SalesDashboardPage')
const LeadsListPage = lazyPage(() => import('./pages/LeadsListPage'), 'LeadsListPage')
const LeadCreatePage = lazyPage(() => import('./pages/LeadCreatePage'), 'LeadCreatePage')
const LeadDetailPage = lazyPage(() => import('./pages/LeadDetailPage'), 'LeadDetailPage')
const ClientsListPage = lazyPage(() => import('./pages/ClientsListPage'), 'ClientsListPage')
const ClientCreatePage = lazyPage(() => import('./pages/ClientCreatePage'), 'ClientCreatePage')
const ClientDetailPage = lazyPage(() => import('./pages/ClientDetailPage'), 'ClientDetailPage')
const SalesAnalyticsPage = lazyPage(() => import('./pages/SalesAnalyticsPage'), 'SalesAnalyticsPage')
const SalesActivityTimelinePage = lazyPage(
  () => import('./pages/SalesActivityTimelinePage'),
  'SalesActivityTimelinePage',
)
const CaseStudiesListPage = lazyPage(() => import('./pages/CaseStudiesListPage'), 'CaseStudiesListPage')

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const salesRoutes = {
  root: '/sales',
  dashboard: '/sales/dashboard',
  leads: '/sales',
  leadNew: '/sales/leads/new',
  leadDetail: (id: string) => `/sales/leads/${id}`,
  leadDetailPath: '/sales/leads/$leadId',
  leadEdit: (id: string) => `/sales/leads/${id}/edit`,
  leadEditPath: '/sales/leads/$leadId/edit',
  clients: '/sales/clients',
  clientNew: '/sales/clients/new',
  clientDetail: (id: string) => `/sales/clients/${id}`,
  clientDetailPath: '/sales/clients/$clientId',
  clientEdit: (id: string) => `/sales/clients/${id}/edit`,
  clientEditPath: '/sales/clients/$clientId/edit',
  analytics: '/sales/analytics',
  activity: '/sales/activity',
  caseStudies: '/sales/case-studies',
} as const

export function createSalesRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
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
        throw redirect({ to: salesRoutes.leads })
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
      path: '/sales/clients/$clientId/edit',
      component: ClientCreatePage,
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
