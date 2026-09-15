import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { safeRedirectOpts } from '@/shared/lib/safeNavigate'

const SalesDashboardPage = lazyPage(() => import('./pages/dashboard/SalesDashboardPage'), 'SalesDashboardPage')
const LeadsListPage = lazyPage(() => import('./pages/lead/LeadsListPage'), 'LeadsListPage')
const LeadCreatePage = lazyPage(() => import('./pages/lead/LeadCreatePage'), 'LeadCreatePage')
const LeadDetailPage = lazyPage(() => import('./pages/lead/LeadDetailPage'), 'LeadDetailPage')
const ClientsListPage = lazyPage(() => import('./pages/client/ClientsListPage'), 'ClientsListPage')
const ClientCreatePage = lazyPage(() => import('./pages/client/ClientCreatePage'), 'ClientCreatePage')
const ClientDetailPage = lazyPage(() => import('./pages/client/ClientDetailPage'), 'ClientDetailPage')
const SalesAnalyticsPage = lazyPage(() => import('./pages/dashboard/SalesAnalyticsPage'), 'SalesAnalyticsPage')
const SalesActivityTimelinePage = lazyPage(
  () => import('./pages/activity/SalesActivityTimelinePage'),
  'SalesActivityTimelinePage',
)
const CaseStudiesListPage = lazyPage(() => import('./pages/case-study/CaseStudiesListPage'), 'CaseStudiesListPage')
const SourcesListPage = lazyPage(() => import('./pages/source/SourcesListPage'), 'SourcesListPage')

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
  sources: '/sales/sources',
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
        throw redirect(safeRedirectOpts({ to: salesRoutes.leads }))
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
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/sales/sources',
      component: SourcesListPage,
    }),
  ]
}
