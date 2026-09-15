import type { EmployeeDetailDto } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

/** Normalize employment state from snake_case or legacy camelCase payloads. */
export function resolveEmploymentState(
  employment: EmployeeDetailDto['employment'] | null | undefined,
): string {
  if (!employment) return 'UNKNOWN'
  const row = employment as EmployeeDetailDto['employment'] & { currentState?: string }
  return row.current_state ?? row.currentState ?? 'UNKNOWN'
}

export const employeeDetailInputClass =
  'w-full rounded-lg border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-transparent transition-colors'

export type EmployeeDetailTab = 'overview' | 'history' | 'salary' | 'documents'
