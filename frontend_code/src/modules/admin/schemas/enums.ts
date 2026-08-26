import { cn } from '@/shared/lib/cn'

export const statusBadgeClass: Record<string, string> = {
  Active: 'status-badge status-success',
  Inactive: 'status-badge status-neutral',
  Locked: 'status-badge status-error',
}

export const statusDot: Record<string, string> = {
  Active: 'bg-emerald-500',
  Inactive: 'bg-slate-400',
  Locked: 'bg-red-500',
}

export const categoryStyles: Record<string, string> = {
  'Core Role': 'bg-secondary/10 text-secondary',
  Operational: 'bg-primary/10 text-primary',
  Financial: 'status-badge status-warning',
  Standard: 'status-badge status-neutral',
}

export const securityScoreDefault = 94