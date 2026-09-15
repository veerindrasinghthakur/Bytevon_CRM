/**
 * Legacy sales hooks barrel — implementations live under hooks/{lead,client,case-study,activity,dashboard}/.
 */
export {
  useLeadsQuery,
  useLead,
  useCreateLead,
  useUpdateLead,
  useLeadsList,
} from './lead/use-leads'

export {
  useClientsQuery,
  useClient,
  useCreateClient,
  useUpdateClient,
  useClientsList,
} from './client/use-clients'

export {
  useCaseStudies,
  useCaseStudiesQuery,
  useCaseStudiesList,
} from './case-study/use-case-studies'

export { useSalesActivities } from './activity/use-activities'
export { useSalesDashboard, useSalesDashboardMetrics } from './dashboard/use-dashboard'
