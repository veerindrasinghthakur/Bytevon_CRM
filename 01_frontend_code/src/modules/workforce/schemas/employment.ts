import { z } from 'zod'

export const employmentStateSchema = z.enum([
  'ONBOARDING',
  'PROBATION',
  'CONFIRMED',
  'SERVING_NOTICE',
  'RESIGNED',
  'TERMINATED',
  'ALUMNI',
])

export const employmentListItemSchema = z.object({
  id: z.number(),
  employee_code: z.string(),
  employment_type: z.string(),
  current_state: employmentStateSchema.or(z.string()),
  joining_date: z.string(),
  fullName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  departmentName: z.string(),
  positionName: z.string(),
  locationName: z.string().optional(),
  hasLogin: z.boolean(),
  avatarInitials: z.string(),
})

export type EmploymentListItemSchema = z.infer<typeof employmentListItemSchema>

export const createEmploymentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  dateOfBirth: z.string().nullable().optional(),
  personalEmail: z.string().email().nullable().optional().or(z.literal('')),
  personalPhone: z.string().max(40).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  employmentType: z.string().min(1),
  joiningDate: z.string().min(1, 'Joining date is required'),
  departmentId: z.number().positive(),
  positionId: z.number().positive(),
  locationId: z.number().positive(),
  shiftId: z.number().positive(),
  workMode: z.string().optional(),
  bank: z
    .object({
      accountHolderName: z.string(),
      bankName: z.string(),
      accountNumber: z.string(),
      ifscCode: z.string(),
    })
    .optional(),
})

export type CreateEmploymentSchemaInput = z.infer<typeof createEmploymentSchema>

// Form helpers only — do NOT re-export employment-list-response here (circular TDZ).
export {
  employmentFormSchema,
  type EmploymentFormInput,
  emptyEmploymentForm,
  toCreateEmploymentInput,
} from './employment-form'
