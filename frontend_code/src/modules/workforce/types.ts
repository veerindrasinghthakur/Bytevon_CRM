/** Re-export domain types from Zod schemas — MODULE_STANDARDS (my-work pattern). */

export type {
  DepartmentListItemSchema,
  DepartmentListItem,
  DepartmentEmployeeSchema,
  DepartmentEmployee,
  CreateDepartmentInput,
  DepartmentFormInput,
} from './schemas/department'

export type { DepartmentListResponse } from './schemas/department-list-response'

export {
  departmentFormSchema,
  emptyDepartmentForm,
  toCreateDepartmentInput,
  departmentListItemSchema,
  createDepartmentSchema,
} from './schemas/department'

export { departmentListResponseSchema } from './schemas/department-list-response'

export type {
  EmploymentListItemSchema,
  CreateEmploymentSchemaInput,
  EmploymentFormInput,
} from './schemas/employment'

export type { EmploymentListResponse } from './schemas/employment-list-response'

export {
  employmentFormSchema,
  emptyEmploymentForm,
  toCreateEmploymentInput,
  employmentStateSchema,
  employmentListItemSchema,
  createEmploymentSchema,
} from './schemas/employment'

export { employmentListResponseSchema } from './schemas/employment-list-response'

export {
  employeeDetailEditSchema,
  type EmployeeDetailEditInput,
} from './schemas/employment-form'

export type {
  RecordStatus,
  DepartmentRole,
  Team,
  TeamMember,
  WorkforceMetric,
  Department,
  Employee,
  EmploymentType,
  EmployeeStatus,
} from './schemas/team'

export {
  workforceAttendanceStatusStyles,
  WORKFORCE_ATTENDANCE_STATUS_OPTIONS,
  employmentStateStyles,
  employmentStateDot,
  employeeStatusStyles,
  departmentStatusStyles,
  loginEnabledClass,
  loginDisabledClass,
} from './schemas/enums'
