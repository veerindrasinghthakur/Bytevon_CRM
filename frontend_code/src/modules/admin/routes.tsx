/**
 * Admin module routes — heavy pages lazy-loaded via shared lazyPage helper.
 * Organization module routes are integrated here as settings sub-routes.
 */
import { createRoute, redirect } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const UsersListPage = lazyPage(() => import('./pages/UsersListPage'), 'UsersListPage')
const UserDetailPage = lazyPage(() => import('./pages/UserDetailPage'), 'UserDetailPage')
const UserCreatePage = lazyPage(() => import('./pages/UserCreatePage'), 'UserCreatePage')
const RolesListPage = lazyPage(() => import('./pages/RolesListPage'), 'RolesListPage')
const RoleDetailPage = lazyPage(() => import('./pages/RoleDetailPage'), 'RoleDetailPage')
const RoleEditPage = lazyPage(() => import('./pages/RoleEditPage'), 'RoleEditPage')
const RoleCreatePage = lazyPage(() => import('./pages/RoleCreatePage'), 'RoleCreatePage')
const AuditLogsPage = lazyPage(() => import('./pages/AuditLogsPage'), 'AuditLogsPage')
const AdminSettingsLayout = lazyPage(() => import('./pages/AdminSettingsLayout'), 'AdminSettingsLayout')
const LeaveSettingsLayout = lazyPage(() => import('./pages/LeaveSettingsLayout'), 'LeaveSettingsLayout')
const AttendanceSettingsLayout = lazyPage(
  () => import('./pages/AttendanceSettingsLayout'),
  'AttendanceSettingsLayout',
)
const OrganizationProfileSection = lazyPage(
  () => import('./pages/settings/OrganizationProfileSection'),
  'OrganizationProfileSection',
)
const HeadOfficeSection = lazyPage(() => import('./pages/settings/HeadOfficeSection'), 'HeadOfficeSection')
const BrandingSection = lazyPage(() => import('./pages/settings/BrandingSection'), 'BrandingSection')
const RegionalSection = lazyPage(() => import('./pages/settings/RegionalSection'), 'RegionalSection')
const OfficeFormPage = lazyPage(() => import('./pages/OfficeFormPage'), 'OfficeFormPage')
const AttendanceSettingsPage = lazyPage(
  () => import('./pages/AttendanceSettingsPage'),
  'AttendanceSettingsPage',
)
const LeaveSettingsPage = lazyPage(() => import('./pages/LeaveSettingsPage'), 'LeaveSettingsPage')
const SecurityCenterPage = lazyPage(() => import('./pages/SecurityCenterPage'), 'SecurityCenterPage')
const LeavePoliciesPage = lazyPage(() => import('./pages/LeavePoliciesPage'), 'LeavePoliciesPage')
const LeaveLedgerPage = lazyPage(() => import('./pages/LeaveLedgerPage'), 'LeaveLedgerPage')
const LocationsListPage = lazyPage(() => import('./pages/organization/LocationsListPage'), 'LocationsListPage')
const LocationDetailPage = lazyPage(() => import('./pages/organization/LocationDetailPage'), 'LocationDetailPage')
const ShiftsListPage = lazyPage(() => import('./pages/organization/ShiftsListPage'), 'ShiftsListPage')
const ShiftDetailPage = lazyPage(() => import('./pages/organization/ShiftDetailPage'), 'ShiftDetailPage')
const WorkingWeeksPage = lazyPage(() => import('./pages/organization/WorkingWeeksPage'), 'WorkingWeeksPage')
const HolidayCalendarsPage = lazyPage(() => import('./pages/organization/HolidayCalendarsPage'), 'HolidayCalendarsPage')
const HolidaysListPage = lazyPage(() => import('./pages/organization/HolidaysListPage'), 'HolidaysListPage')
const PositionsListPage = lazyPage(() => import('./pages/organization/PositionsListPage'), 'PositionsListPage')
const PositionDetailPage = lazyPage(() => import('./pages/organization/PositionDetailPage'), 'PositionDetailPage')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminSettingsLayoutRoute(appLayoutRoute: any) {
  return createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/settings',
    component: AdminSettingsLayout,
    validateSearch: () => ({}),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminOrganizationSettingsRoutes(settingsLayoutRoute: any) {
  return [
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/locations', component: LocationsListPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/locations/$locationId', component: LocationDetailPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/shifts', component: ShiftsListPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/shifts/new', component: ShiftDetailPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/shifts/$shiftId', component: ShiftDetailPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/working-weeks', component: WorkingWeeksPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/holidays', component: HolidayCalendarsPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/holidays/$calendarId', component: HolidaysListPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/positions', component: PositionsListPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/positions/new', component: PositionDetailPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => settingsLayoutRoute, path: '/positions/$positionId', component: PositionDetailPage, validateSearch: () => ({}) }),
  ]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWorkforceShiftRoutes(appLayoutRoute: any) {
  return [
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/workforce/shifts', component: ShiftsListPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/workforce/shifts/new', component: ShiftDetailPage, validateSearch: () => ({}) }),
    createRoute({ getParentRoute: () => appLayoutRoute, path: '/workforce/shifts/$shiftId', component: ShiftDetailPage, validateSearch: () => ({}) }),
  ]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminSettingsCoreRoutes(settingsLayoutRoute: any) {
  const adminSettingsRoutes = [
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/',
      component: OrganizationProfileSection,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/head-office',
      component: HeadOfficeSection,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/branding',
      component: BrandingSection,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/regional',
      component: RegionalSection,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/offices/new',
      component: OfficeFormPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/offices/$officeId/edit',
      component: OfficeFormPage,
      validateSearch: () => ({}),
    }),
  ]

  const organizationSettingsRoutes = createAdminOrganizationSettingsRoutes(settingsLayoutRoute)

  return [...adminSettingsRoutes, ...organizationSettingsRoutes]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminRoutes(appLayoutRoute: any) {
  const attendanceLayout = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/attendance-settings',
    component: AttendanceSettingsLayout,
    validateSearch: () => ({}),
  })
  const leaveLayout = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/leave-settings',
    component: LeaveSettingsLayout,
    validateSearch: () => ({}),
  })

  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin',
      beforeLoad: () => {
        throw redirect({ to: '/admin/users' } as any)
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users',
      component: UsersListPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users/new',
      component: UserCreatePage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users/$userId',
      component: UserDetailPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles',
      component: RolesListPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/new',
      component: RoleCreatePage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/$roleId',
      component: RoleDetailPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/$roleId/edit',
      component: RoleEditPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization',
      beforeLoad: () => {
        throw redirect({ to: '/admin/settings' } as any)
      },
    }),
    attendanceLayout.addChildren([
      createRoute({
        getParentRoute: () => attendanceLayout,
        path: '/',
        component: AttendanceSettingsPage,
        validateSearch: () => ({}),
      }),
    ]),
    leaveLayout.addChildren([
      createRoute({
        getParentRoute: () => leaveLayout,
        path: '/',
        component: LeaveSettingsPage,
        validateSearch: () => ({}),
      }),
      createRoute({
        getParentRoute: () => leaveLayout,
        path: '/policies',
        component: LeavePoliciesPage,
        validateSearch: () => ({}),
      }),
      createRoute({
        getParentRoute: () => leaveLayout,
        path: '/ledger/$employeeId',
        component: LeaveLedgerPage,
        validateSearch: () => ({}),
      }),
    ]),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/leave-policies',
      beforeLoad: () => {
        throw redirect({ to: '/admin/leave-settings/policies' } as any)
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/leave-ledger/$employeeId',
      beforeLoad: ({ params }) => {
        throw redirect({
          to: '/admin/leave-settings/ledger/$employeeId',
          params: { employeeId: params.employeeId },
        } as any)
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/audit',
      component: AuditLogsPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/security',
      component: SecurityCenterPage,
      validateSearch: () => ({}),
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/notifications',
      beforeLoad: () => {
        throw redirect({ to: '/notifications/settings' } as any)
      },
    }),
  ]
}
