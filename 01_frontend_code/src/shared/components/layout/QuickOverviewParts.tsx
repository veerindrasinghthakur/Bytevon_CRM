import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function QuickSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-sm',
        className,
      )}
    >
      <h3 className="text-title-lg font-semibold text-on-surface mb-4">{title}</h3>
      {children}
    </section>
  )
}

/** Single stat tile for Quick Statistics grid. */
export function QuickStat({
  icon,
  value,
  label,
}: {
  icon: string
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background border border-outline-variant hover:border-secondary transition-colors group">
      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary mb-2 transition-colors" aria-hidden>
        {icon}
      </span>
      <span className="text-headline-md font-semibold text-on-surface mb-1">{value}</span>
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</span>
    </div>
  )
}

export function QuickStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>
}

/** Meta tile with optional icon (General Info grid). */
export function QuickMetaTile({
  icon,
  label,
  value,
}: {
  icon?: string
  label: string
  value: ReactNode
}) {
  return (
    <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/60">
      <div className="flex items-center gap-2 text-on-surface-variant mb-2">
        {icon && (
          <span className="material-symbols-outlined text-base" aria-hidden>
            {icon}
          </span>
        )}
        <span className="text-label-md font-medium">{label}</span>
      </div>
      <div className="text-body-md text-on-surface font-medium">{value}</div>
    </div>
  )
}

/** Related information key-value row. */
export function QuickRelatedRow({
  icon,
  label,
  value,
}: {
  icon?: string
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-outline-variant/40 last:border-0 gap-3">
      <span className="text-body-sm text-on-surface-variant flex items-center gap-2 shrink-0">
        {icon && (
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            {icon}
          </span>
        )}
        {label}
      </span>
      <span className="text-body-md text-on-surface font-medium text-right min-w-0 truncate">{value}</span>
    </div>
  )
}

/** Person / team assignment row with avatar initials. */
export function QuickPersonRow({
  initials,
  roleLabel,
  name,
}: {
  initials: string
  roleLabel: string
  name: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low border border-transparent">
      <div className="w-10 h-10 rounded-lg bg-deep-navy text-on-primary flex items-center justify-center text-label-sm font-bold shrink-0">
        {initials.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-label-md text-on-surface-variant mb-0.5">{roleLabel}</p>
        <p className="text-body-md text-on-surface font-medium truncate">{name}</p>
      </div>
    </div>
  )
}
