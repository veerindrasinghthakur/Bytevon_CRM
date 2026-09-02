export { EmployeesListPage } from './pages/EmployeesListPage'
export { EmployeeCreatePage } from './pages/EmployeeCreatePage'
export { EmployeeDetailPage } from './pages/EmployeeDetailPage'
export { DepartmentsListPage } from './pages/DepartmentsListPage'
export { DepartmentCreatePage } from './pages/DepartmentCreatePage'
export { DepartmentDetailPage } from './pages/DepartmentDetailPage'
export { AddMemberPage } from './pages/AddMemberPage'
export { TeamsListPage } from './pages/TeamsListPage'
export { TeamDetailPage } from './pages/TeamDetailPage'
export { TeamMembersPage } from './pages/TeamMembersPage'
export { TeamProjectsPage } from './pages/TeamProjectsPage'
export { TeamEditPage } from './pages/TeamEditPage'
export { AssignProjectPage } from './pages/AssignProjectPage'
export { AttendanceDashboardPage } from './pages/AttendanceDashboardPage'
export { AttendanceEmployeesPage } from './pages/AttendanceEmployeesPage'
export { WorkforceAttendanceDetailPage } from './pages/WorkforceAttendanceDetailPage'
export { WorkforceRosterPage } from './pages/WorkforceRosterPage'
export { AttendanceDayDetailPage } from './pages/AttendanceDayDetailPage'
export { ChangeAssignmentPage } from './pages/ChangeAssignmentPage'

export { createWorkforceRoutes, workforceRoutes } from './routes'

export {
  listDepartments,
  getDepartment,
  listDepartmentEmployees,
  createDepartment,
  updateDepartment,
  assignEmployeeToDepartment,
  removeEmployeeFromDepartment,
  listEmploymentOptionsForPicker,
  listEmployeesNotInDepartment,
  listEmployeesOnShift,
} from './api/departments'

export {
  listEmployments,
  getEmployeeDetail,
  createEmployment,
  updateEmployment,
  getOrgMastersForEmployeeForm,
} from './api/employment'

export {
  getAttendanceDashboard,
  listTodayAttendance,
  getAttendanceById,
  getAttendanceDayDetail,
  listAttendanceCorrections,
} from './api/attendance'

export { useEmployeesList } from './hooks/use-employees-list'
export { useDepartmentsList } from './hooks/use-departments-list'
export { useTeamsList } from './hooks/use-teams-list'
export { useDepartmentDetail } from './hooks/use-department-detail'
export { useTeamDetail } from './hooks/use-team-detail'
export {
  useAttendanceDashboard,
  useTodayAttendance,
  useAttendanceDetail,
  useAttendanceDayDetail,
} from './hooks/use-attendance'

export type * from './types'
