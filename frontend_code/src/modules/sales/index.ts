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

export { useLeadsList } from './hooks/use-leads-list'
export { useClientsList } from './hooks/use-clients-list'
export { useCaseStudiesList } from './hooks/use-case-studies-list'
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
