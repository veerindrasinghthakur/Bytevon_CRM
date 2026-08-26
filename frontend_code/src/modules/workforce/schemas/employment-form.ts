import { z } from 'zod'

/** UI form — string fields for inputs/Selects; map to CreateEmploymentInput on submit. */
export const employmentFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  personalEmail: z.string().email().optional().or(z.literal('')),
  personalPhone: z.string().optional().or(z.literal('')),
  street: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  stateRegion: z.string().optional().or(z.literal('')),
  zip: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  employmentType: z.string().min(1),
  joiningDate: z.string().min(1, 'Joining date is required'),
  departmentId: z.string().min(1, 'Department is required'),
  positionId: z.string().min(1, 'Position is required'),
  locationId: z.string().min(1, 'Location is required'),
  shiftId: z.string().min(1, 'Shift is required'),
  managerId: z.string().optional().or(z.literal('')),
  accountHolderName: z.string().optional().or(z.literal('')),
  bankName: z.string().optional().or(z.literal('')),
  accountNumber: z.string().optional().or(z.literal('')),
  ifsc: z.string().optional().or(z.literal('')),
})

export type EmploymentFormInput = z.infer<typeof employmentFormSchema>

export const emptyEmploymentForm = (): EmploymentFormInput => ({
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  personalEmail: '',
  personalPhone: '',
  street: '',
  city: '',
  stateRegion: '',
  zip: '',
  country: '',
  employmentType: 'FULL_TIME',
  joiningDate: '',
  departmentId: '',
  positionId: '',
  locationId: '',
  shiftId: '',
  managerId: '',
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
})
