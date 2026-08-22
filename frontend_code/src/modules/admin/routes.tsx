/**
 * Admin module routes.
 * createAdminRoutes(appLayout) — users, roles, audit, security, redirects, leave/attendance layouts
 * createAdminSettingsShell(appLayout) — returns the settings layout route (call before org settings children)
 */
import { createRoute, redirect } from '@tanstack/react-router'
import { UsersListPage } from './pages/UsersListPage'
import { UserDetailPage } from './pages/UserDetailPage'
import { UserCreatePage } from './pages/UserCreatePage'
import { RolesListPage } from './pages/RolesListPage'
import { RoleDetailPage } from './pages/RoleDetailPage'
import { RoleEditPage } from './pages/RoleEditPage'
import { RoleCreatePage } from './pages/RoleCreatePage'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { AdminSettingsLayout } from './pages/AdminSettingsLayout'
import { LeaveSettingsLayout } from './pages/LeaveSettingsLayout'
import { AttendanceSettingsLayout } from './pages/AttendanceSettingsLayout'
import { OrganizationProfileSection } from './pages/settings/OrganizationProfileSection'
import { HeadOfficeSection } from './pages/settings/HeadOfficeSection'
import { BrandingSection } from './pages/settings/BrandingSection'
import { RegionalSection } from './pages/settings/RegionalSection'
import { OfficeFormPage } from './pages/OfficeFormPage'
import { AttendanceSettingsPage } from './pages/AttendanceSettingsPage'
import { LeaveSettingsPage } from './pages/LeaveSettingsPage'
import { SecurityCenterPage } from './pages/SecurityCenterPage'
import { LeavePoliciesPage } from './pages/LeavePoliciesPage'
import { LeaveLedgerPage } from './pages/LeaveLedgerPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminSettingsLayoutRoute(appLayoutRoute: any) {
  return createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/settings',
    component: AdminSettingsLayout,
  })
}

/** Non-organization children of /admin/settings (org locations/shifts live in organization/routes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminSettingsCoreRoutes(settingsLayoutRoute: any) {
  return [
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminRoutes(appLayoutRoute: any) {
  const attendanceLayout = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/attendance-settings',
    component: AttendanceSettingsLayout,
  })
  const leaveLayout = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/admin/leave-settings',
    component: LeaveSettingsLayout,
  })

  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin',
      beforeLoad: () => {
        throw redirect({ to: '/admin/users' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users',
      component: UsersListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users/new',
      component: UserCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/users/$userId',
      component: UserDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles',
      component: RolesListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/new',
      component: RoleCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/$roleId',
      component: RoleDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/roles/$roleId/edit',
      component: RoleEditPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization',
      beforeLoad: () => {
        throw redirect({ to: '/admin/settings' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization/locations',
      beforeLoad: () => {
        throw redirect({ to: '/admin/settings/locations' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization/locations/$locationId',
      beforeLoad: ({ params }) => {
        throw redirect({
          to: '/admin/settings/locations/$locationId',
          params: { locationId: params.locationId },
        })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization/shifts',
      beforeLoad: () => {
        throw redirect({ to: '/admin/settings/shifts' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization/working-weeks',
      beforeLoad: () => {
        throw redirect({ to: '/admin/settings/working-weeks' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization/holidays',
      beforeLoad: () => {
        throw redirect({ to: '/admin/settings/holidays' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization/holidays/$calendarId',
      beforeLoad: ({ params }) => {
        throw redirect({
          to: '/admin/settings/holidays/$calendarId',
          params: { calendarId: params.calendarId },
        })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/organization/positions',
      beforeLoad: () => {
        throw redirect({ to: '/admin/settings/positions' })
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
        throw redirect({ to: '/admin/leave-settings/policies' })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/leave-ledger/$employeeId',
      beforeLoad: ({ params }) => {
        throw redirect({
          to: '/admin/leave-settings/ledger/$employeeId',
          params: { employeeId: params.employeeId },
        })
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/audit',
      component: AuditLogsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/security',
      component: SecurityCenterPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/admin/notifications',
      beforeLoad: () => {
        throw redirect({ to: '/notifications/settings' })
      },
    }),
  ]
}
