/** Admin hooks barrel — single entry. */
export { useUsersList } from './user/use-users'
export { useUserDetail } from './user/use-user-detail'
export { useUserCreate } from './user/use-user-create'
export { useRolesList } from './role/use-roles'
export { useRoleForm } from './role/use-role-form'
export { useSecurityScore } from './security/use-security-score'
export { useAttendanceSettings } from './settings/use-attendance-settings'
export { useHeadOffice } from './settings/use-head-office'
export {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useOrgLocationsForSelect,
  useWorkingWeeks,
  useHolidayCalendars,
  useHolidays,
  usePositions,
} from './settings/use-settings'
export { useLocationsList, useLocationDetail, useUpdateLocation } from './location/use-locations'
export { useShiftsList, useShiftDetail, useShiftStaff, useCreateShift, useUpdateShift } from './shift/use-shifts'
export { useLeaveSettingsModal } from './leave/use-leave-settings'
export { useAdminMutation } from './use-admin-mutation'
