/** Re-export domain types from Zod schemas — MODULE_STANDARDS (my-work pattern). */

export type {
  DepartmentListItemSchema,
  DepartmentListItem,
  DepartmentEmployeeSchema,
  DepartmentEmployee,
  CreateDepartmentInput,
  DepartmentFormInput,
  DepartmentListResponse,
} from './schemas/department'

export {
  departmentFormSchema,
  emptyDepartmentForm,
  toCreateDepartmentInput,
  departmentListItemSchema,
  createDepartmentSchema,
} from './schemas/department'

export type {
  EmploymentListItemSchema,
  CreateEmploymentSchemaInput,
  EmploymentFormInput,
  EmploymentListResponse,
} from './schemas/employment'

export {
  employmentFormSchema,
  emptyEmploymentForm,
  toCreateEmploymentInput,
  employmentStateSchema,
  employmentListItemSchema,
  createEmploymentSchema,
} from './schemas/employment'

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
