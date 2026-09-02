/**
 * Thin re-export of shift seed data for Shift* pages.
 * Canonical seed lives in shared/mock/data/workforce.ts (MODULE_STANDARDS).
 */

export {
  shifts,
  shiftEmployeesById,
  employeesOnShift,
  canCreateShift,
  type ShiftRow,
  type ShiftEmployee,
} from '@/shared/mock/data/workforce'

/** Convenience alias used by some pages */
export { shifts as shiftsMock } from '@/shared/mock/data/workforce'
