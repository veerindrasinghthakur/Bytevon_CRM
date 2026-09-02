import { z } from 'zod'
import type { CreateEmploymentSchemaInput } from './employment'

/** UI form — string fields for inputs/Selects; map via toCreateEmploymentInput on submit. */
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

/** Profile fields editable on Employee detail. */
export const employeeDetailEditSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  personalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  personalPhone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})

export type EmployeeDetailEditInput = z.infer<typeof employeeDetailEditSchema>

/** Form → API create payload (string Select ids → numbers; address/bank assembled). */
export function toCreateEmploymentInput(form: EmploymentFormInput): CreateEmploymentSchemaInput {
  const addressParts = [form.street, form.city, form.stateRegion, form.zip, form.country]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
  const address = addressParts.length ? addressParts.join(', ') : null

  const safeAccountNumber = form.accountNumber?.trim?.() ?? ''
  const safeAccountHolderName = form.accountHolderName?.trim?.() ?? ''
  const safeBankName = form.bankName?.trim?.() ?? ''
  const safeIfsc = form.ifsc?.trim?.() ?? ''

  const bank =
    safeAccountNumber.length > 0
      ? {
          accountHolderName: safeAccountHolderName || `${form.firstName} ${form.lastName}`.trim(),
          bankName: safeBankName,
          accountNumber: safeAccountNumber,
          ifscCode: safeIfsc,
        }
      : undefined

  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    dateOfBirth: form.dateOfBirth?.trim?.() || null,
    personalEmail: form.personalEmail?.trim?.() || null,
    personalPhone: form.personalPhone?.trim?.() || null,
    address,
    employmentType: form.employmentType,
    joiningDate: form.joiningDate,
    departmentId: Number(form.departmentId),
    positionId: Number(form.positionId),
    locationId: Number(form.locationId),
    shiftId: Number(form.shiftId),
    bank,
  }
}
