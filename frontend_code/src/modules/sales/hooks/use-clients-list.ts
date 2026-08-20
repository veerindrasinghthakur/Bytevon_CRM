import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clients, clientMetrics } from '../data/mock'
import type { Client } from '../types'

const LONG_PRESS_MS = 3000

export function useClientsList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [quickView, setQuickView] = useState<Client | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        (c.primaryContact?.toLowerCase().includes(q) ?? false) ||
        c.id.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || c.status === statusFilter
      const matchType = typeFilter === 'All' || c.type === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    const visible = new Set(filtered.map((c) => c.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)))
      if (next.size === 0 && selectionMode) setSelectionMode(false)
      return next
    })
  }, [filtered, selectionMode])

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
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  const toggleSelectAllFiltered = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
      setSelectionMode(false)
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
      setSelectionMode(true)
    }
  }, [allFilteredSelected, filtered])

  const exitSelectionMode = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const startLongPress = useCallback(
    (id: string) => {
      longPressTriggered.current = false
      clearLongPress()
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true
        enterSelectionWith(id)
      }, LONG_PRESS_MS)
    },
    [clearLongPress, enterSelectionWith],
  )

  const endLongPress = useCallback(
    (client: Client) => {
      clearLongPress()
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        return
      }
      if (selectionMode) toggleOne(client.id)
      else setQuickView(client)
    },
    [clearLongPress, selectionMode, toggleOne],
  )

  const resetFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('All')
    setTypeFilter('All')
  }, [])

  return {
    metrics: clientMetrics,
    totalCount: clients.length,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    resetFilters,
    quickView,
    setQuickView,
    selectionMode,
    selectedIds,
    allFilteredSelected,
    toggleOne,
    toggleSelectAllFiltered,
    exitSelectionMode,
    startLongPress,
    endLongPress,
    clearLongPress,
  }
}
