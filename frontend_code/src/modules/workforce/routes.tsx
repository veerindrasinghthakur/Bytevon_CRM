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
const WorkforceRosterPage = lazyPage(() => import('./pages/WorkforceRosterPage'), 'WorkforceRosterPage')
const AttendanceDayDetailPage = lazyPage(
  () => import('./pages/AttendanceDayDetailPage'),
  'AttendanceDayDetailPage',
)
const ChangeAssignmentPage = lazyPage(() => import('./pages/ChangeAssignmentPage'), 'ChangeAssignmentPage')
const TeamsListPage = lazyPage(() => import('./pages/TeamsListPage'), 'TeamsListPage')
const TeamCreatePage = lazyPage(() => import('@/modules/projects/pages/TeamCreatePage'), 'TeamCreatePage')
const TeamDetailPage = lazyPage(() => import('./pages/TeamDetailPage'), 'TeamDetailPage')
const TeamMembersPage = lazyPage(() => import('./pages/TeamMembersPage'), 'TeamMembersPage')
const TeamProjectsPage = lazyPage(() => import('./pages/TeamProjectsPage'), 'TeamProjectsPage')
const AddMemberPage = lazyPage(() => import('./pages/AddMemberPage'), 'AddMemberPage')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWorkforceRoutes(appLayoutRoute: any) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce',
      beforeLoad: () => {
        throw redirect({ to: '/workforce/employees' })
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
      path: '/workforce/teams/$teamId/add-member',
      component: AddMemberPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/attendance',
      component: WorkforceRosterPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/attendance/$employmentId',
      validateSearch: (search: Record<string, unknown>) => ({
        date: typeof search.date === 'string' ? search.date : undefined,
      }),
      component: AttendanceDayDetailPage,
    }),
  ]
}
