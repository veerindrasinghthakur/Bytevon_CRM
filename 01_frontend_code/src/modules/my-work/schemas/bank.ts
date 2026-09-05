import { z } from 'zod'

export const bankAccountTypeSchema = z.enum(['Savings', 'Current', 'Salary'])
export type BankAccountType = z.infer<typeof bankAccountTypeSchema>

export const bankDetailsSchema = z.object({
  id: z.string().optional(),
  accountHolderName: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  confirmAccountNumber: z.string().optional(),
  ifscOrRouting: z.string(),
  branch: z.string(),
  accountType: bankAccountTypeSchema,
  country: z.string(),
  currency: z.string(),
  upiId: z.string().optional(),
  pan: z.string().optional(),
})
export type BankDetails = z.infer<typeof bankDetailsSchema>
