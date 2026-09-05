import { z } from 'zod'
import type { SalaryItem, SaveSalaryStructureInput } from './payroll'

/** UI form — amount as string for controlled inputs; map via toSaveSalaryInput. */
export const salaryItemFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['EARNING', 'DEDUCTION']),
  amount: z.string(),
})
export type SalaryItemFormInput = z.infer<typeof salaryItemFormSchema>

export const salaryFormSchema = z.object({
  effectiveFrom: z.string().min(1, 'Effective from is required'),
  items: z.array(salaryItemFormSchema).min(1, 'At least one salary item is required'),
})
export type SalaryFormInput = z.infer<typeof salaryFormSchema>

export function emptySalaryItemForm(): SalaryItemFormInput {
  return { id: `new-${Date.now()}`, name: '', type: 'EARNING', amount: '0' }
}

export function salaryItemsToForm(items: SalaryItem[]): SalaryItemFormInput[] {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    type: i.type,
    amount: String(i.amount),
  }))
}

export function toSaveSalaryInput(form: SalaryFormInput): SaveSalaryStructureInput {
  return {
    effectiveFrom: form.effectiveFrom,
    items: form.items.map((i, idx) => ({
      id: i.id || `item-${idx}`,
      name: i.name.trim(),
      type: i.type,
      amount: Number(i.amount) || 0,
    })),
  }
}
