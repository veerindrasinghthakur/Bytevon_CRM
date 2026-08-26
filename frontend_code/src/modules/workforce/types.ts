/** Workforce domain types — schema re-exports + UI shapes */

export type {
  DepartmentListItemSchema,
  DepartmentListResponse,
  DepartmentEmployeeSchema,
  CreateDepartmentInput,
  DepartmentFormInput,
} from './schemas/department'

export type {
  EmploymentListItemSchema,
  EmploymentListResponse,
  CreateEmploymentSchemaInput,
  EmploymentFormInput,
} from './schemas/employment'

export {
  departmentFormSchema,
  emptyDepartmentForm,
} from './schemas/department-form'

export {
  employmentFormSchema,
  emptyEmploymentForm,
} from './schemas/employment-form'

/** Prefer schema-derived list item for departments */
export type { DepartmentListItemSchema as DepartmentListItem } from './schemas/department'
export type { DepartmentEmployeeSchema as DepartmentEmployee } from './schemas/department'

export type RecordStatus = 'Active' | 'Inactive'
export type EmploymentType = 'Full-Time Regular' | 'Contractor' | 'Part-Time' | 'Intern'
export type EmployeeStatus =
  | 'Confirmed'
  | 'Onboarding'
  | 'Probation'
  | 'Remote'
  | 'Pending'
  | 'Active'
  | 'Archived'
export type DepartmentRole = 'Lead' | 'Senior' | 'Junior'

/** Legacy / detail UI shape (string ids) — list pages use DepartmentListItem */
export interface Department {
  id: string
  name: string
  code: string
  description?: string
  headId?: string
  headName: string
  headTitle?: string
  parentId?: string | null
  parentName?: string
  status: RecordStatus
  colorTag?: string
  staffCount: number
  projectCount: number
  openPositions?: number
  healthScore?: number
  budgetLabel?: string
  budgetRemaining?: string
  icon?: string
}

/** Legacy employee UI shape — list pages use EmploymentListItem from API */
export interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  name: string
  email: string
  phone?: string
  title: string
  departmentId: string
  department: string
  managerId?: string
  managerName?: string
  employmentType: EmploymentType
  status: EmployeeStatus
  joiningDate: string
  location?: string
  avatarInitials?: string
  gender?: string
  nationality?: string
  personalEmail?: string
  emergencyName?: string
  emergencyRelation?: string
  emergencyPhone?: string
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  departmentId: string
  department: string
  headId?: string
  headName: string
  headTitle?: string
  memberCount: number
  projectCount: number
  status: RecordStatus
  velocity?: number
  allocationPct?: number
  createdOn?: string
  mission?: string
  icon?: string
}

export interface TeamMember {
  id: string
  employeeId: string
  name: string
  title: string
  department: string
  roleInTeam?: DepartmentRole
  experienceYears?: number
  joinedLabel?: string
  availability?: 'Available' | 'Transitioning' | 'Busy'
}

export interface WorkforceMetric {
  id: string
  label: string
  value: string
  subtitle?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
}
