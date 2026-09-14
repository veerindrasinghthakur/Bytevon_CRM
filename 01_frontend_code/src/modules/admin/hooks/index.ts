/** Admin hooks barrel — dual paths until domain git mv is applied. */
export { useUsersList } from './use-users-list'
export { useUserDetail } from './use-user-detail'
export { useUserCreate } from './use-user-create'
export { useRolesList } from './use-roles-list'
export { useRoleForm } from './use-role-form'
export { useSecurityScore } from './use-security-score'
export { useAttendanceSettings } from './use-attendance-settings'
export { useHeadOffice } from './use-head-office'
export {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useOrgLocationsForSelect,
  useWorkingWeeks,
  useHolidayCalendars,
  useHolidays,
  usePositions,
} from './use-organization'
export { useLocationsList, useLocationDetail, useUpdateLocation } from './use-organization-locations'
export { useShiftsList, useShiftDetail, useShiftStaff, useCreateShift, useUpdateShift } from './use-organization-shifts'
export { useLeaveSettingsModal } from './use-leave-settings-modal'
export { useAdminMutation } from './use-admin-mutation'
