import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'

interface BulkSelectionBarProps {
  selectedCount: number
  /** Number of rows currently visible after filters (select-all scope) */
  filteredCount: number
  onCancel: () => void
  children?: ReactNode
}

/**
 * Shown when list selection mode is on.
 * Place bulk action buttons in `children`.
 */
export function BulkSelectionBar({
  selectedCount,
  filteredCount,
  onCancel,
  children,
}: BulkSelectionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-secondary/30 bg-secondary/5">
      <span className="text-body-sm font-semibold text-on-surface">
        {selectedCount} selected
        <span className="text-on-surface-variant font-normal"> (of {filteredCount} shown)</span>
      </span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      {children}
    </div>
  )
}
