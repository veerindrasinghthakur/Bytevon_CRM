export { EmployeesListPage } from './pages/EmployeesListPage'
export { EmployeeCreatePage } from './pages/EmployeeCreatePage'
export { EmployeeDetailPage } from './pages/EmployeeDetailPage'
export { DepartmentsListPage } from './pages/DepartmentsListPage'
export { DepartmentCreatePage } from './pages/DepartmentCreatePage'
export { DepartmentDetailPage } from './pages/DepartmentDetailPage'
export { AddMemberPage } from './pages/AddMemberPage'
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
  deleteDepartment,
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
export { usePersons, usePerson } from './hooks/person/use-persons'
export {
  useDepartments,
  useDepartment,
  DEPARTMENTS_LIST_KEY,
  departmentDetailKey,
  departmentStaffKey,
} from './hooks/department/use-departments'
export {
  useAttendanceDashboard,
  useTodayAttendance,
  useAttendanceDetail,
  useAttendanceDayDetail,
} from './hooks/use-attendance'

export type * from './types'
