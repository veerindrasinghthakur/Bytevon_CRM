import { useCallback, useEffect, useRef, useState } from 'react'

/** Hold duration before a row enters bulk selection mode */
export const LIST_LONG_PRESS_MS = 3000

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

/**
 * Shared bulk-selection strategy for every list page.
 *
 * Rules (product standard):
 * 1. Hold a row ≥ 3 seconds → enter selection mode and select that row.
 * 2. While in selection mode, click toggles the row.
 * 3. Unchecking the last selected row → exit selection mode.
 * 4. “Select all” applies only to currently filtered / rendered items.
 * 5. When filters change, selection is pruned to still-visible ids.
 */
export function useListSelection<T>({
  items,
  getId,
}: UseListSelectionOptions<T>): UseListSelectionResult {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const visibleIds = items.map(getId)

  // Prune selection when the filtered set changes
  useEffect(() => {
    const visible = new Set(visibleIds)
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)))
      if (next.size === 0) {
        setSelectionMode(false)
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when filter membership changes
  }, [visibleIds.join('|')])

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const enterSelectionWith = useCallback((id: string) => {
    setSelectionMode(true)
    setSelectedIds(new Set([id]))
  }, [])

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectionMode(false)
      else setSelectionMode(true)
      return next
    })
  }, [])

  const allFilteredSelected =
    items.length > 0 && items.every((item) => selectedIds.has(getId(item)))

  const toggleSelectAllFiltered = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected =
        items.length > 0 && items.every((item) => prev.has(getId(item)))
      if (allSelected) {
        setSelectionMode(false)
        return new Set()
      }
      setSelectionMode(true)
      return new Set(items.map(getId))
    })
  }, [items, getId])

  const exitSelectionMode = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const onRowPressStart = useCallback(
    (id: string) => {
      longPressTriggered.current = false
      clearLongPress()
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true
        enterSelectionWith(id)
      }, LIST_LONG_PRESS_MS)
    },
    [clearLongPress, enterSelectionWith]
  )

  const onRowPressEnd = useCallback(
    (id: string, onShortPress?: () => void) => {
      clearLongPress()
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        return
      }
      if (selectionMode) {
        toggleOne(id)
      } else {
        onShortPress?.()
      }
    },
    [clearLongPress, selectionMode, toggleOne]
  )

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  return {
    selectionMode,
    selectedIds,
    selectedCount: selectedIds.size,
    allFilteredSelected,
    isSelected,
    toggleSelectAllFiltered,
    toggleOne,
    enterSelectionWith,
    exitSelectionMode,
    onRowPressStart,
    onRowPressEnd,
    onRowPressCancel: clearLongPress,
  }
}
