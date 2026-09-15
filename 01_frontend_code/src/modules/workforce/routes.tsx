/**
 * Workforce module routes (employees, departments, attendance).
 * Teams UI is owned by Projects — /workforce/teams* redirects to /projects/teams*.
 * Shifts are registered via organization.createWorkforceShiftRoutes.
 */
import { createRoute, redirect } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'
import { safeRedirectOpts } from '@/shared/lib/safeNavigate'

const EmployeesListPage = lazyPage(() => import('./pages/EmployeesListPage'), 'EmployeesListPage')
const EmployeeCreatePage = lazyPage(() => import('./pages/EmployeeCreatePage'), 'EmployeeCreatePage')
const EmployeeDetailPage = lazyPage(() => import('./pages/employee/EmployeeDetailPage'), 'EmployeeDetailPage')
const EmployeeBankDetailsPage = lazyPage(() => import('./pages/EmployeeBankDetailsPage'), 'EmployeeBankDetailsPage')
const DepartmentsListPage = lazyPage(() => import('./pages/DepartmentsListPage'), 'DepartmentsListPage')
const DepartmentCreatePage = lazyPage(() => import('./pages/DepartmentCreatePage'), 'DepartmentCreatePage')
const DepartmentDetailPage = lazyPage(() => import('./pages/DepartmentDetailPage'), 'DepartmentDetailPage')
const AttendanceDashboardPage = lazyPage(
  () => import('./pages/AttendanceDashboardPage'),
  'AttendanceDashboardPage',
)
const AttendanceEmployeesPage = lazyPage(
  () => import('./pages/AttendanceEmployeesPage'),
  'AttendanceEmployeesPage',
)
const WorkforceRosterPage = lazyPage(() => import('./pages/WorkforceRosterPage'), 'WorkforceRosterPage')
const WorkforceAttendanceDetailPage = lazyPage(
  () => import('./pages/WorkforceAttendanceDetailPage'),
  'WorkforceAttendanceDetailPage',
)
const AttendanceDayDetailPage = lazyPage(
  () => import('./pages/AttendanceDayDetailPage'),
  'AttendanceDayDetailPage',
)
const ChangeAssignmentPage = lazyPage(() => import('./pages/ChangeAssignmentPage'), 'ChangeAssignmentPage')
const AddMemberPage = lazyPage(() => import('./pages/AddMemberPage'), 'AddMemberPage')

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const workforceRoutes = {
  root: '/workforce',
  employees: '/workforce/employees',
  employeeNew: '/workforce/employees/new',
  employeeDetail: (id: string | number) => `/workforce/employees/${id}`,
  employeeDetailPath: '/workforce/employees/$employeeId',
  employeeAssignment: (id: string | number) => `/workforce/employees/${id}/assignment`,
  employeeAssignmentPath: '/workforce/employees/$employeeId/assignment',
  employeeBankDetails: (id: string | number) => `/workforce/employees/${id}/bank-details`,
  employeeBankDetailsPath: '/workforce/employees/$employeeId/bank-details',
  departments: '/workforce/departments',
  departmentNew: '/workforce/departments/new',
  departmentDetail: (id: string | number) => `/workforce/departments/${id}`,
  departmentDetailPath: '/workforce/departments/$departmentId',
  /** Teams owned by projects — helpers alias project paths for any leftover callers */
  teams: '/projects/teams',
  teamNew: '/projects/teams/new',
  teamDetail: (id: string | number) => `/projects/teams/${id}`,
  teamDetailPath: '/projects/teams/$teamId',
  teamEdit: (id: string | number) => `/projects/teams/${id}/edit`,
  teamEditPath: '/projects/teams/$teamId/edit',
  teamMembers: (id: string | number) => `/projects/teams/${id}/members`,
  teamMembersPath: '/projects/teams/$teamId/members',
  teamProjects: (id: string | number) => `/projects/teams/${id}/projects`,
  teamProjectsPath: '/projects/teams/$teamId/projects',
  teamAssignProject: (id: string | number) => `/projects/teams/${id}/assign-project`,
  teamAssignProjectPath: '/projects/teams/$teamId/assign-project',
  teamAddMember: (id: string | number) => `/projects/teams/${id}/add-member`,
  teamAddMemberPath: '/projects/teams/$teamId/add-member',
  attendance: '/workforce/attendance',
  attendanceEmployees: '/workforce/attendance/employees',
  attendanceRoster: '/workforce/attendance/roster',
  attendanceRecord: (attendanceId: string | number) => `/workforce/attendance/${attendanceId}`,
  attendanceRecordPath: '/workforce/attendance/$attendanceId',
  attendanceDay: (employmentId: string | number) => `/workforce/attendance/day/${employmentId}`,
  attendanceDayPath: '/workforce/attendance/day/$employmentId',
} as const

export function createWorkforceRoutes<TParent extends AnyRoute>(appLayoutRoute: TParent) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce',
      beforeLoad: () => {
        throw redirect(safeRedirectOpts({ to: workforceRoutes.employees }))
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/employees',
      component: EmployeesListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/employees/new',
      component: EmployeeCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/employees/$employeeId',
      component: EmployeeDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/employees/$employeeId/assignment',
      component: ChangeAssignmentPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/employees/$employeeId/bank-details',
      component: EmployeeBankDetailsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/departments',
      component: DepartmentsListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/departments/new',
      component: DepartmentCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/departments/$departmentId',
      component: DepartmentDetailPage,
    }),
    // Legacy team paths → projects
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams',
      beforeLoad: () => {
        throw redirect(safeRedirectOpts({ to: '/projects/teams' }))
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/new',
      beforeLoad: () => {
        throw redirect(safeRedirectOpts({ to: '/projects/teams/new' }))
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/projects/teams/$teamId',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/edit',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/projects/teams/$teamId/edit',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/members',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/projects/teams/$teamId/members',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/projects',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/projects/teams/$teamId/projects',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/assign-project',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/projects/teams/$teamId/assign-project',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/add-member',
      beforeLoad: ({ params }) => {
        throw redirect(
          safeRedirectOpts({
            to: '/projects/teams/$teamId/add-member',
            params: { teamId: String(params.teamId) },
          }),
        )
      },
    }),
    // Department add-member stays under workforce
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/departments/$departmentId/add-member',
      component: AddMemberPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/attendance',
      component: AttendanceDashboardPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/attendance/employees',
      component: AttendanceEmployeesPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/attendance/roster',
      component: WorkforceRosterPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/attendance/day/$employmentId',
      validateSearch: (search: Record<string, unknown>) => ({
        date: typeof search.date === 'string' ? search.date : undefined,
      }),
      component: AttendanceDayDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/attendance/$attendanceId',
      component: WorkforceAttendanceDetailPage,
    }),
  ]
}
