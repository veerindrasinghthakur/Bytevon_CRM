/** Admin hooks barrel — domain paths preferred; legacy paths still work. */
export { useUsersList } from './user/use-users'
export { useRolesList } from './role/use-roles'
export { useSecurityScoreAnimation } from './security/use-security-score'
export { useLocationsList, useLocationDetail, useUpdateLocation } from './location/use-locations'
export {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useOrgLocationsForSelect,
  useWorkingWeeks,
  useHolidayCalendars,
  useHolidays,
  usePositions,
} from './settings/use-settings'
export { useShiftFormData } from './settings/use-attendance-settings'
// Still at hooks root until moved:
export { useUserCreate } from './use-user-create'
export { useUserDetail } from './use-user-detail'
export { useRoleForm } from './use-role-form'
export { useAdminMutation } from './use-admin-mutation'
