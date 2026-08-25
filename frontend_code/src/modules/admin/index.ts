export { UsersListPage } from './pages/UsersListPage'
export { UserDetailPage } from './pages/UserDetailPage'
export { UserCreatePage } from './pages/UserCreatePage'
export { RolesListPage } from './pages/RolesListPage'
export { RoleDetailPage } from './pages/RoleDetailPage'
export { RoleEditPage } from './pages/RoleEditPage'
export { RoleCreatePage } from './pages/RoleCreatePage'
export { AuditLogsPage } from './pages/AuditLogsPage'
export { AdminSettingsLayout } from './pages/AdminSettingsLayout'
export { LeaveSettingsLayout } from './pages/LeaveSettingsLayout'
export { AttendanceSettingsLayout } from './pages/AttendanceSettingsLayout'
export { OrganizationProfileSection } from './pages/settings/OrganizationProfileSection'
export { HeadOfficeSection } from './pages/settings/HeadOfficeSection'
export { BrandingSection } from './pages/settings/BrandingSection'
export { RegionalSection } from './pages/settings/RegionalSection'
export { OfficeFormPage } from './pages/OfficeFormPage'
export { AttendanceSettingsPage } from './pages/AttendanceSettingsPage'
export { LeaveSettingsPage } from './pages/LeaveSettingsPage'
export { SecurityCenterPage } from './pages/SecurityCenterPage'
export { LeavePoliciesPage } from './pages/LeavePoliciesPage'
export { LeaveLedgerPage } from './pages/LeaveLedgerPage'
export {
  createAdminRoutes,
  createAdminSettingsLayoutRoute,
  createAdminSettingsCoreRoutes,
  createAdminOrganizationSettingsRoutes,
  createWorkforceShiftRoutes,
} from './routes'

export {
  LocationsListPage,
  LocationDetailPage,
  ShiftsListPage,
  ShiftDetailPage,
  WorkingWeeksPage,
  HolidayCalendarsPage,
  HolidaysListPage,
  PositionsListPage,
  OrganizationSettingsPage,
} from './pages/organization'

// API surface
export * from './api/organization'
export * from './api/users'
export * from './api/roles'
export * from './api/leave'
export * from './api/settings'
export * from './api/audit'
export * from './api/metrics'
export * from './api/offices'
export * from './api/security'

// Hooks
export { useLocationsList, useLocationDetail, useUpdateLocation } from './hooks/use-organization-locations'
export { useShiftsList, useShiftDetail, useShiftStaff, useCreateShift, useUpdateShift } from './hooks/use-organization-shifts'
export {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useOrgLocationsForSelect,
  useWorkingWeeks,
  useHolidayCalendars,
  useHolidays,
  usePositions,
} from './hooks/use-organization'
export { useUsersList } from './hooks/use-users-list'
export { useUserCreate } from './hooks/use-user-create'
export { useRolesList } from './hooks/use-roles-list'
export { useRoleForm } from './hooks/use-role-form'
