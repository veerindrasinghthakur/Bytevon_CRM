import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveNotification,
  archiveReadNotifications,
  computeInboxKpis,
  listInboxNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import type { NotificationTab, NotificationTabId } from '../types'

const QK = ['notifications', 'inbox'] as const

export type { NotificationTabId }

export function useNotificationCenter() {
  const qc = useQueryClient()
  const inboxQuery = useQuery({
    queryKey: QK,
    queryFn: listInboxNotifications,
  })

  const items = inboxQuery.data ?? []

  const [tab, setTab] = useState<NotificationTabId>('all')
  const [selectedId, setSelectedId] = useState<string>('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  })
  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  })
  const archiveMut = useMutation({
    mutationFn: archiveNotification,
    onSuccess: invalidate,
  })
  const archiveReadMut = useMutation({
    mutationFn: archiveReadNotifications,
    onSuccess: invalidate,
  })

  const unreadCount = items.filter((n) => n.status === 'Unread').length
  const highCount = items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length
  const mentionCount = items.filter(
    (n) =>
      n.body.includes('@') ||
      n.title.toLowerCase().includes('mention') ||
      (n.tags ?? []).some((t) => t.toLowerCase().includes('mention')),
  ).length

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (tab === 'unread' && n.status !== 'Unread') return false
      if (tab === 'high' && n.priority !== 'High' && n.priority !== 'Critical') return false
      if (tab === 'archived' && n.status !== 'Archived') return false
      if (tab === 'mentions') {
        const mention =
          n.body.toLowerCase().includes('@') ||
          n.title.toLowerCase().includes('mention') ||
          (n.tags ?? []).some((t) => t.toLowerCase().includes('mention'))
        if (!mention) return false
      }
      if (priorityFilter === 'High' && n.priority !== 'High' && n.priority !== 'Critical') return false
      if (priorityFilter === 'Medium' && n.priority !== 'Normal') return false
      if (priorityFilter === 'Low' && n.priority !== 'Low') return false
      if (moduleFilter !== 'All' && n.module !== moduleFilter) return false
      if (typeFilter === 'System' && n.module !== 'System') return false
      if (
        typeFilter === 'Approval' &&
        !n.title.toLowerCase().includes('leave') &&
        !n.title.toLowerCase().includes('request')
      )
        return false
      if (typeFilter === 'Mention' && !n.body.includes('@') && !(n.tags ?? []).includes('Mention')) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.module.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [items, tab, query, typeFilter, priorityFilter, moduleFilter])

  const selected =
    filtered.find((n) => n.id === selectedId) ??
    filtered[0] ??
    items.find((n) => n.id === selectedId) ??
    null

  const selectNotification = useCallback(
    (id: string) => {
      setSelectedId(id)
      const n = items.find((x) => x.id === id)
      if (n?.status === 'Unread') markReadMut.mutate(id)
    },
    [items, markReadMut],
  )

  const resetFilters = () => {
    setQuery('')
    setTypeFilter('All')
    setPriorityFilter('All')
    setModuleFilter('All')
  }

  const filtersActive =
    Boolean(query) || typeFilter !== 'All' || priorityFilter !== 'All' || moduleFilter !== 'All'

  const tabs: NotificationTab[] = [
    { id: 'all', label: `All (${items.length})` },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'mentions', label: `Mentions (${mentionCount})` },
    { id: 'high', label: `High Priority (${highCount})` },
    { id: 'archived', label: 'Archived' },
  ]

  const modules = Array.from(new Set(items.map((n) => n.module)))
  const kpis = computeInboxKpis(items)

  return {
    isLoading: inboxQuery.isLoading,
    kpis,
    tab,
    setTab,
    tabs,
    selected,
    selectedId,
    setSelectedId,
    selectNotification,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    priorityFilter,
    setPriorityFilter,
    moduleFilter,
    setModuleFilter,
    modules,
    filtered,
    items,
    filtersActive,
    resetFilters,
    markAllRead: () => markAllMut.mutate(),
    archiveRead: () => archiveReadMut.mutate(),
    markRead: (id: string) => markReadMut.mutate(id),
    archiveOne: (id: string) => archiveMut.mutate(id),
    menuOpenId,
    setMenuOpenId,
  }
}
