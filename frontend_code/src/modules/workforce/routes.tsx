/**
 * Workforce module routes (employees, departments, teams, attendance).
 * Shifts are registered via organization.createWorkforceShiftRoutes.
 * Heavy pages lazy-loaded via shared lazyPage helper.
 */
import { createRoute, redirect } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const EmployeesListPage = lazyPage(() => import('./pages/EmployeesListPage'), 'EmployeesListPage')
const EmployeeCreatePage = lazyPage(() => import('./pages/EmployeeCreatePage'), 'EmployeeCreatePage')
const EmployeeDetailPage = lazyPage(() => import('./pages/EmployeeDetailPage'), 'EmployeeDetailPage')
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
const TeamsListPage = lazyPage(() => import('./pages/TeamsListPage'), 'TeamsListPage')
const TeamCreatePage = lazyPage(() => import('@/modules/projects/pages/TeamCreatePage'), 'TeamCreatePage')
const TeamDetailPage = lazyPage(() => import('./pages/TeamDetailPage'), 'TeamDetailPage')
const TeamEditPage = lazyPage(() => import('./pages/TeamEditPage'), 'TeamEditPage')
const TeamMembersPage = lazyPage(() => import('./pages/TeamMembersPage'), 'TeamMembersPage')
const TeamProjectsPage = lazyPage(() => import('./pages/TeamProjectsPage'), 'TeamProjectsPage')
const AssignProjectPage = lazyPage(() => import('./pages/AssignProjectPage'), 'AssignProjectPage')
const AddMemberPage = lazyPage(() => import('./pages/AddMemberPage'), 'AddMemberPage')

/** Canonical path helpers — prefer these over hard-coded strings in pages. */
export const workforceRoutes = {
  root: '/workforce',
  employees: '/workforce/employees',
  employeeNew: '/workforce/employees/new',
  employeeDetail: (id: string | number) => `/workforce/employees/${id}`,
  employeeAssignment: (id: string | number) => `/workforce/employees/${id}/assignment`,
  departments: '/workforce/departments',
  departmentNew: '/workforce/departments/new',
  departmentDetail: (id: string | number) => `/workforce/departments/${id}`,
  teams: '/workforce/teams',
  teamNew: '/workforce/teams/new',
  teamDetail: (id: string | number) => `/workforce/teams/${id}`,
  teamEdit: (id: string | number) => `/workforce/teams/${id}/edit`,
  teamMembers: (id: string | number) => `/workforce/teams/${id}/members`,
  teamProjects: (id: string | number) => `/workforce/teams/${id}/projects`,
  teamAssignProject: (id: string | number) => `/workforce/teams/${id}/assign-project`,
  teamAddMember: (id: string | number) => `/workforce/teams/${id}/add-member`,
  /** Org attendance dashboard (primary secondary-nav entry). */
  attendance: '/workforce/attendance',
  attendanceEmployees: '/workforce/attendance/employees',
  attendanceRoster: '/workforce/attendance/roster',
  /** Mock record detail (todayAttendance row id). */
  attendanceRecord: (attendanceId: string | number) => `/workforce/attendance/${attendanceId}`,
  /** Employment day detail (punches/breaks) with optional ?date=. */
  attendanceDay: (employmentId: string | number) => `/workforce/attendance/day/${employmentId}`,
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWorkforceRoutes(appLayoutRoute: any) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce',
      beforeLoad: () => {
        throw redirect({ to: workforceRoutes.employees })
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
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams',
      component: TeamsListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/new',
      component: TeamCreatePage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId',
      component: TeamDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/edit',
      component: TeamEditPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/members',
      component: TeamMembersPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/projects',
      component: TeamProjectsPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/assign-project',
      component: AssignProjectPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/teams/$teamId/add-member',
      component: AddMemberPage,
    }),
    // Attendance — static segments before $attendanceId
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
