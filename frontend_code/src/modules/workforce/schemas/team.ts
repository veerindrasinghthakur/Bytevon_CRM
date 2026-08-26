import { z } from 'zod'

export const recordStatusSchema = z.enum(['Active', 'Inactive'])
export type RecordStatus = z.infer<typeof recordStatusSchema>

export const departmentRoleSchema = z.enum(['Lead', 'Senior', 'Junior'])
export type DepartmentRole = z.infer<typeof departmentRoleSchema>

export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  departmentId: z.string(),
  department: z.string(),
  headId: z.string().optional(),
  headName: z.string(),
  headTitle: z.string().optional(),
  memberCount: z.number(),
  projectCount: z.number(),
  status: recordStatusSchema,
  velocity: z.number().optional(),
  allocationPct: z.number().optional(),
  createdOn: z.string().optional(),
  mission: z.string().optional(),
  icon: z.string().optional(),
})
export type Team = z.infer<typeof teamSchema>

export const teamMemberSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  name: z.string(),
  title: z.string(),
  department: z.string(),
  roleInTeam: departmentRoleSchema.optional(),
  experienceYears: z.number().optional(),
  joinedLabel: z.string().optional(),
  availability: z.enum(['Available', 'Transitioning', 'Busy']).optional(),
})
export type TeamMember = z.infer<typeof teamMemberSchema>

export const workforceMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  subtitle: z.string().optional(),
  change: z.string().optional(),
  changeType: z.enum(['positive', 'negative', 'neutral']).optional(),
  icon: z.string(),
})
export type WorkforceMetric = z.infer<typeof workforceMetricSchema>

/** Legacy string-id department card shape (seed / demos only). */
export const departmentUiSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  headId: z.string().optional(),
  headName: z.string(),
  headTitle: z.string().optional(),
  parentId: z.string().nullable().optional(),
  parentName: z.string().optional(),
  status: recordStatusSchema,
  colorTag: z.string().optional(),
  staffCount: z.number(),
  projectCount: z.number(),
  openPositions: z.number().optional(),
  healthScore: z.number().optional(),
  budgetLabel: z.string().optional(),
  budgetRemaining: z.string().optional(),
  icon: z.string().optional(),
})
export type Department = z.infer<typeof departmentUiSchema>

export const employmentTypeUiSchema = z.enum([
  'Full-Time Regular',
  'Contractor',
  'Part-Time',
  'Intern',
])
export type EmploymentType = z.infer<typeof employmentTypeUiSchema>

export const employeeStatusUiSchema = z.enum([
  'Confirmed',
  'Onboarding',
  'Probation',
  'Remote',
  'Pending',
  'Active',
  'Archived',
])
export type EmployeeStatus = z.infer<typeof employeeStatusUiSchema>

/** Legacy string-id employee card shape (seed / demos only). */
export const employeeUiSchema = z.object({
  id: z.string(),
  employeeCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  title: z.string(),
  departmentId: z.string(),
  department: z.string(),
  managerId: z.string().optional(),
  managerName: z.string().optional(),
  employmentType: employmentTypeUiSchema,
  status: employeeStatusUiSchema,
  joiningDate: z.string(),
  location: z.string().optional(),
  avatarInitials: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  personalEmail: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyPhone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
})
export type Employee = z.infer<typeof employeeUiSchema>
