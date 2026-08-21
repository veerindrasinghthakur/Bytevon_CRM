/** Shared layout / shell / common UI types */

export interface SecondaryNavItem {
  id: string
  label: string
  icon: string
  to: string
  badge?: number | string
  visible?: boolean
}

export interface SecondaryNavGroup {
  moduleId: string
  title: string
  items: SecondaryNavItem[]
}

export interface RailItem {
  id: string
  icon: string
  label: string
  to: string
  /** If false, item is hidden (permission) */
  visible?: boolean
}

export interface MetricCardBase {
  id: string
  label: string
  value: string
  subtitle?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
}

/** Bulk list selection (long-press) — shared across list pages */
export interface UseListSelectionOptions<T> {
  /** Currently rendered / filtered rows (selection is scoped to these) */
  items: T[]
  /** Stable unique id per row */
  getId: (item: T) => string
}

export interface UseListSelectionResult {
  selectionMode: boolean
  selectedIds: Set<string>
  selectedCount: number
  allFilteredSelected: boolean
  isSelected: (id: string) => boolean
  /** Header checkbox: select or clear all *filtered* rows */
  toggleSelectAllFiltered: () => void
  toggleOne: (id: string) => void
  enterSelectionWith: (id: string) => void
  exitSelectionMode: () => void
  /** Bind to row: start 3s timer */
  onRowPressStart: (id: string) => void
  /** Bind to row: clear timer; if long-press fired do nothing else call onShortPress */
  onRowPressEnd: (id: string, onShortPress?: () => void) => void
  onRowPressCancel: () => void
}
