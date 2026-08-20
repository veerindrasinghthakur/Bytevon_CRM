import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { leads, salesMetrics } from '../data/mock'
import type { Lead, PipelineStage, LeadPriority } from '../types'

const LONG_PRESS_MS = 3000

export function useLeadsList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [stageFilter, setStageFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [quickView, setQuickView] = useState<Lead | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        l.contactName.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || l.status === statusFilter
      const matchStage = stageFilter === 'All' || l.stage === stageFilter
      const matchPriority = priorityFilter === 'All' || l.priority === priorityFilter
      const matchSource = sourceFilter === 'All' || l.source === sourceFilter
      return matchSearch && matchStatus && matchStage && matchPriority && matchSource
    })
  }, [search, statusFilter, stageFilter, priorityFilter, sourceFilter])

  useEffect(() => {
    const visible = new Set(filtered.map((l) => l.id))
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
    filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))

  const toggleSelectAllFiltered = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
      setSelectionMode(false)
    } else {
      setSelectedIds(new Set(filtered.map((l) => l.id)))
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
    (lead: Lead) => {
      clearLongPress()
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        return
      }
      if (selectionMode) toggleOne(lead.id)
      else setQuickView(lead)
    },
    [clearLongPress, selectionMode, toggleOne],
  )

  const resetFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('All')
    setStageFilter('All')
    setPriorityFilter('All')
    setSourceFilter('All')
  }, [])

  const stages: PipelineStage[] = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost',
  ]
  const priorities: LeadPriority[] = ['Critical', 'High', 'Medium', 'Low']

  return {
    metrics: salesMetrics,
    totalCount: leads.length,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    priorityFilter,
    setPriorityFilter,
    sourceFilter,
    setSourceFilter,
    stages,
    priorities,
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
