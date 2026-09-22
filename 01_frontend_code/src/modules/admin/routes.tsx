/**
 * Admin module routes — heavy pages lazy-loaded via shared lazyPage helper.
 * Paths prefer domain folders; legacy re-exports keep old imports working.
 */
import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { safeRedirectOpts } from '@/shared/lib/safeNavigate'
import { requirePermission, requireView } from '@/shared/rbac/require-permission'

const UsersListPage = lazyPage(() => import('./pages/user/UsersListPage'), 'UsersListPage')
const UserDetailPage = lazyPage(() => import('./pages/user/UserDetailPage'), 'UserDetailPage')
const UserCreatePage = lazyPage(() => import('./pages/user/UserCreatePage'), 'UserCreatePage')
const RolesListPage = lazyPage(() => import('./pages/role/RolesListPage'), 'RolesListPage')
const RoleDetailPage = lazyPage(() => import('./pages/role/RoleDetailPage'), 'RoleDetailPage')
const RoleEditPage = lazyPage(() => import('./pages/role/RoleEditPage'), 'RoleEditPage')
const RoleCreatePage = lazyPage(() => import('./pages/role/RoleCreatePage'), 'RoleCreatePage')
const AuditLogsPage = lazyPage(() => import('./pages/audit/AuditLogsPage'), 'AuditLogsPage')
const AdminSettingsLayout = lazyPage(() => import('./pages/settings/AdminSettingsLayout'), 'AdminSettingsLayout')
const LeaveSettingsLayout = lazyPage(() => import('./pages/settings/LeaveSettingsLayout'), 'LeaveSettingsLayout')
const AttendanceSettingsLayout = lazyPage(
  () => import('./pages/settings/AttendanceSettingsLayout'),
  'AttendanceSettingsLayout',
)
const OrganizationProfileSection = lazyPage(
  () => import('./pages/settings/OrganizationProfileSection'),
  'OrganizationProfileSection',
)
const HeadOfficeSection = lazyPage(() => import('./pages/settings/HeadOfficeSection'), 'HeadOfficeSection')
const BrandingSection = lazyPage(() => import('./pages/settings/BrandingSection'), 'BrandingSection')
const RegionalSection = lazyPage(() => import('./pages/settings/RegionalSection'), 'RegionalSection')
const OfficeFormPage = lazyPage(() => import('./pages/settings/OfficeFormPage'), 'OfficeFormPage')
const AttendanceSettingsPage = lazyPage(
  () => import('./pages/settings/AttendanceSettingsPage'),
  'AttendanceSettingsPage',
)
const LeaveSettingsPage = lazyPage(() => import('./pages/settings/LeaveSettingsPage'), 'LeaveSettingsPage')
const SecurityCenterPage = lazyPage(() => import('./pages/security/SecurityCenterPage'), 'SecurityCenterPage')
const LeavePoliciesPage = lazyPage(() => import('./pages/settings/LeavePoliciesPage'), 'LeavePoliciesPage')
const LeaveLedgerPage = lazyPage(() => import('./pages/settings/LeaveLedgerPage'), 'LeaveLedgerPage')
const LocationsListPage = lazyPage(() => import('./pages/location/LocationsListPage'), 'LocationsListPage')
const LocationDetailPage = lazyPage(() => import('./pages/location/LocationDetailPage'), 'LocationDetailPage')
const ShiftsListPage = lazyPage(() => import('./pages/shift/ShiftsListPage'), 'ShiftsListPage')
const ShiftDetailPage = lazyPage(() => import('./pages/shift/ShiftDetailPage'), 'ShiftDetailPage')
const WorkingWeeksPage = lazyPage(() => import('./pages/working_week/WorkingWeeksPage'), 'WorkingWeeksPage')
const HolidayCalendarsPage = lazyPage(() => import('./pages/holiday_calendar/HolidayCalendarsPage'), 'HolidayCalendarsPage')
const HolidaysListPage = lazyPage(() => import('./pages/holiday_calendar/HolidaysListPage'), 'HolidaysListPage')
const PositionsListPage = lazyPage(() => import('./pages/position/PositionsListPage'), 'PositionsListPage')
const PositionDetailPage = lazyPage(() => import('./pages/position/PositionDetailPage'), 'PositionDetailPage')

export function createAdminSettingsLayoutRoute<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  return createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/settings',
    beforeLoad: requireView('org_settings'),
    component: AdminSettingsLayout,
  })
}

export function createAdminOrganizationSettingsRoutes<TParent extends AnyRoute>(
  settingsLayoutRoute: TParent,
) {
  return [
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/locations', component: LocationsListPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/locations/$locationId', component: LocationDetailPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/shifts', component: ShiftsListPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/shifts/new', component: ShiftDetailPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/shifts/$shiftId', component: ShiftDetailPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/working-weeks', component: WorkingWeeksPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/holidays', component: HolidayCalendarsPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/holidays/$calendarId', component: HolidaysListPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/positions', component: PositionsListPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/positions/new', component: PositionDetailPage }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/positions/$positionId', component: PositionDetailPage }),
  ]
}

export function createWorkforceShiftRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/shifts',
      beforeLoad: requireView('shift'),
      component: ShiftsListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/shifts/new',
      beforeLoad: requireView('shift'),
      component: ShiftDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/shifts/$shiftId',
      beforeLoad: requireView('shift'),
      component: ShiftDetailPage,
    }),
  ]
}

export function createAdminSettingsCoreRoutes<TParent extends AnyRoute>(
  settingsLayoutRoute: TParent,
) {
  const adminSettingsRoutes = [
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/',
      component: OrganizationProfileSection,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/head-office',
      component: HeadOfficeSection,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/branding',
      component: BrandingSection,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/regional',
      component: RegionalSection,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/offices/new',
      component: OfficeFormPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/offices/$officeId/edit',
      component: OfficeFormPage,
    }),
  ]

  const organizationSettingsRoutes = createAdminOrganizationSettingsRoutes(settingsLayoutRoute)

  return [...adminSettingsRoutes, ...organizationSettingsRoutes]
}

export const myAdminRoutes = {
  usersList: '/admin/users',
  usersNew: '/admin/users/new',
  usersDetail: (userId: string) => `/admin/users/$userId`.replace('$userId', userId),
  rolesList: '/admin/roles',
  rolesNew: '/admin/roles/new',
  rolesDetail: (roleId: string) => `/admin/roles/$roleId`.replace('$roleId', roleId),
  rolesEdit: (roleId: string) => `/admin/roles/$roleId/edit`.replace('$roleId', roleId),
  auditLogs: '/admin/audit',
  audit: '/admin/audit',
  security: '/admin/security',
  attendanceSettings: '/admin/attendance-settings',
  leaveSettings: '/admin/leave-settings',
  shiftsList: '/admin/settings/shifts',
  shiftsNew: '/admin/settings/shifts/new',
  shiftsDetail: (shiftId: string) => `/admin/settings/shifts/${shiftId}`,
  locationsList: '/admin/settings/locations',
  locationsDetail: (locationId: string) => `/admin/settings/locations/${locationId}`,
  officesNew: '/admin/settings/offices/new',
  officesEdit: (officeId: string) => `/admin/settings/offices/${officeId}/edit`,
}

export function createAdminRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  const attendanceLayout = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/attendance-settings',
    beforeLoad: requireView('attendance'),
    component: AttendanceSettingsLayout,
  })
  const leaveLayout = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/leave-settings',
    beforeLoad: requireView('leave_policy'),
    component: LeaveSettingsLayout,
  })

  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin',
      beforeLoad: () => {
        throw redirect(safeRedirectOpts({ to: myAdminRoutes.usersList }))
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users',
      beforeLoad: requireView('user'),
      component: UsersListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users/new',
      beforeLoad: () => requirePermission({ action: 'CREATE', resource: 'user' }),
      component: UserCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users/$userId',
      beforeLoad: requireView('user'),
      component: UserDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles',
      beforeLoad: requireView('role'),
      component: RolesListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/new',
      beforeLoad: () => requirePermission({ action: 'CREATE', resource: 'role' }),
      component: RoleCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/$roleId',
      beforeLoad: requireView('role'),
      component: RoleDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/$roleId/edit',
      beforeLoad: () => requirePermission({ action: 'UPDATE', resource: 'role' }),
      component: RoleEditPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization',
      beforeLoad: () => {
        throw redirect(safeRedirectOpts({ to: myAdminRoutes.shiftsList }))
      },
    }),
    attendanceLayout.addChildren([
      createRoute({
        getParentRoute: () => attendanceLayout,
        path: '/',
        component: AttendanceSettingsPage,
      }),
    ]),
    leaveLayout.addChildren([
      createRoute({
        getParentRoute: () => leaveLayout,
        path: '/',
        component: LeaveSettingsPage,
      }),
      createRoute({
        getParentRoute: () => leaveLayout,
        path: '/policies',
        component: LeavePoliciesPage,
      }),
      createRoute({
        getParentRoute: () => leaveLayout,
        path: '/ledger/$employeeId',
        component: LeaveLedgerPage,
      }),
    ]),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/leave-policies',
      beforeLoad: () => {
        throw redirect(safeRedirectOpts({ to: myAdminRoutes.leaveSettings + '/policies' }))
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/leave-ledger/$employeeId',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: myAdminRoutes.leaveSettings + '/ledger/' + params.employeeId,
            params: { employeeId: String(params.employeeId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/audit',
      beforeLoad: requireView('audit'),
      component: AuditLogsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/security',
      beforeLoad: requireView('org_settings'),
      component: SecurityCenterPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/notifications',
      beforeLoad: () => {
        throw redirect(safeRedirectOpts({ to: '/notifications/settings' }))
      },
    }),
  ]
}
