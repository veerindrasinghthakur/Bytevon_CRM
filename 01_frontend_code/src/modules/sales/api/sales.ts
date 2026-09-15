/**
 * Sales API barrel — domain implementations live in api/{lead,client,case-study,activity,dashboard,source}.ts.
 * Kept for backward-compatible imports (`from '../api/sales'`).
 */

export {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  changeLeadStage,
  getLeadFilterOptions,
  listSalesRepresentatives,
  listPlatforms,
} from './lead'

export {
  listClients,
  getClientById,
  createClient,
  updateClient,
  getClientFilterOptions,
} from './client'

export { listCaseStudies } from './case-study'
export { listSalesActivities } from './activity'
export { getDashboardMetrics } from './dashboard'
