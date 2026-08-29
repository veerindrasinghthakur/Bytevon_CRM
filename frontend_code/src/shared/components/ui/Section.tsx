import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <div className={cn('bv-surface p-6', className)}>
      <h3 className="text-title-lg font-semibold text-on-background mb-4">{title}</h3>
      {children}
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  className?: string
}

export function Field({ label, value, className }: FieldProps) {
  return (
    <div className={cn('mb-3 last:mb-0', className)}>
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-body-md text-on-background">{value}</p>
    </div>
  )
}

interface EditableFieldProps {
  label: string
  value: string
  editing: boolean
  registration: Record<string, unknown>
  error?: string
  className?: string
}

export function EditableField({ label, value, editing, registration, error, className }: EditableFieldProps) {
  return (
    <div className={cn('mb-3 last:mb-0', className)}>
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      {editing ? (
        <>
          <input
            {...registration}
            defaultValue={value}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-body-sm outline-none transition-colors',
              error
                ? 'border-error focus:border-error focus:ring-2 focus:ring-error/30'
                : 'border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/30',
            )}
          />
          {error && <p className="mt-1 text-caption text-error">{error}</p>}
        </>
      ) : (
        <p className="text-body-md text-on-background">{value}</p>
      )}
    </div>
  )
}