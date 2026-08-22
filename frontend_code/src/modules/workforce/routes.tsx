/**
 * Workforce module routes (employees, departments, teams, attendance).
 * Shifts are registered via organization.createWorkforceShiftRoutes.
 */
import { createRoute, redirect } from '@tanstack/react-router'
import { EmployeesListPage } from './pages/EmployeesListPage'
import { EmployeeCreatePage } from './pages/EmployeeCreatePage'
import { EmployeeDetailPage } from './pages/EmployeeDetailPage'
import { DepartmentsListPage } from './pages/DepartmentsListPage'
import { DepartmentCreatePage } from './pages/DepartmentCreatePage'
import { DepartmentDetailPage } from './pages/DepartmentDetailPage'
import { WorkforceRosterPage } from './pages/WorkforceRosterPage'
import { AttendanceDayDetailPage } from './pages/AttendanceDayDetailPage'
import { ChangeAssignmentPage } from './pages/ChangeAssignmentPage'
import { TeamsListPage } from './pages/TeamsListPage'
import { TeamCreatePage } from '@/modules/projects/pages/TeamCreatePage'
import { TeamDetailPage } from './pages/TeamDetailPage'

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
