import { z } from 'zod'
import { bankAccountTypeSchema } from './bank'

export const bankFormSchema = z
  .object({
    accountHolderName: z.string().min(1, 'Required'),
    bankName: z.string().min(1, 'Required'),
    accountNumber: z.string().min(1, 'Required'),
    confirmAccountNumber: z.string().min(1, 'Required'),
    ifscOrRouting: z.string().min(1, 'Required'),
    branch: z.string().min(1, 'Required'),
    accountType: bankAccountTypeSchema,
    country: z.string().min(1),
    currency: z.string().min(1),
    upiId: z.string().optional(),
    pan: z.string().optional(),
  })
  .refine((d) => d.accountNumber === d.confirmAccountNumber, {
    message: 'Account numbers do not match',
    path: ['confirmAccountNumber'],
  })

export type BankFormValues = z.infer<typeof bankFormSchema>

export const emptyBankForm = (): BankFormValues => ({
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscOrRouting: '',
  branch: '',
  accountType: 'Salary',
  country: 'India',
  currency: 'INR',
  upiId: '',
  pan: '',
})
