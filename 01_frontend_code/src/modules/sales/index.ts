export { SalesDashboardPage } from './pages/dashboard/SalesDashboardPage'
export { LeadsListPage } from './pages/lead/LeadsListPage'
export { LeadCreatePage } from './pages/lead/LeadCreatePage'
export { LeadDetailPage } from './pages/lead/LeadDetailPage'
export { ClientsListPage } from './pages/client/ClientsListPage'
export { ClientCreatePage } from './pages/client/ClientCreatePage'
export { ClientDetailPage } from './pages/client/ClientDetailPage'
export { SalesAnalyticsPage } from './pages/dashboard/SalesAnalyticsPage'
export { SalesActivityTimelinePage } from './pages/activity/SalesActivityTimelinePage'
export { CaseStudiesListPage } from './pages/case-study/CaseStudiesListPage'

export { createSalesRoutes, salesRoutes } from './routes'

export {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  listClients,
  getClientById,
  createClient,
  updateClient,
  listCaseStudies,
  listSalesActivities,
  getDashboardMetrics,
  getLeadFilterOptions,
  getClientFilterOptions,
  listSalesRepresentatives,
} from './api/sales'

export { useLeadsList } from './hooks/lead/use-leads'
export { useClientsList } from './hooks/client/use-clients'
export { useCaseStudiesList } from './hooks/case-study/use-case-studies'
export {
  useLeadsQuery,
  useLead,
  useCreateLead,
  useUpdateLead,
  useClientsQuery,
  useClient,
  useCreateClient,
  useUpdateClient,
  useCaseStudies,
  useSalesActivities,
  useSalesDashboardMetrics,
} from './hooks/use-sales'
