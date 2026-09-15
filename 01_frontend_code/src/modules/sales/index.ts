export { SalesDashboardPage } from './pages/SalesDashboardPage'
export { LeadsListPage } from './pages/LeadsListPage'
export { LeadCreatePage } from './pages/LeadCreatePage'
export { LeadDetailPage } from './pages/LeadDetailPage'
export { ClientsListPage } from './pages/ClientsListPage'
export { ClientCreatePage } from './pages/ClientCreatePage'
export { ClientDetailPage } from './pages/ClientDetailPage'
export { SalesAnalyticsPage } from './pages/SalesAnalyticsPage'
export { SalesActivityTimelinePage } from './pages/SalesActivityTimelinePage'
export { CaseStudiesListPage } from './pages/CaseStudiesListPage'

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
export { useSalesDashboard } from './hooks/dashboard/use-dashboard'
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
