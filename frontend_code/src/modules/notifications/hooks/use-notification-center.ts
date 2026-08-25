import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveNotification,
  archiveReadNotifications,
  computeInboxKpis,
  listAllInboxNotifications,
  listInboxNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import type { NotificationTab, NotificationTabId } from '../types'

export type { NotificationTabId }

export function useNotificationCenter() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<NotificationTabId>('all')
  const [selectedId, setSelectedId] = useState<string>('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const listParams = useMemo(
    () => ({
      search: query || undefined,
      tab,
      typeFilter,
      priorityFilter,
      moduleFilter,
      page: 1,
      pageSize: 100,
    }),
    [query, tab, typeFilter, priorityFilter, moduleFilter],
  )

  const inboxQuery = useQuery({
    queryKey: queryKeys.notifications.inbox(listParams),
    queryFn: () => listInboxNotifications(listParams),
    placeholderData: (prev) => prev,
  })

  /** Full set for KPIs / module options (stable key) */
  const allQuery = useQuery({
    queryKey: [...queryKeys.notifications.all, 'inbox-all'] as const,
    queryFn: listAllInboxNotifications,
  })

  const items = allQuery.data ?? []
  const filtered = inboxQuery.data?.items ?? []
  const unreadCount = inboxQuery.data?.unreadCount ?? items.filter((n) => n.status === 'Unread').length
  const highCount =
    inboxQuery.data?.highCount ??
    items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length
  const mentionCount =
    inboxQuery.data?.mentionCount ??
    items.filter(
      (n) =>
        n.body.includes('@') ||
        n.title.toLowerCase().includes('mention') ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes('mention')),
    ).length

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void invalidate.notifications(qc),
  })
  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void invalidate.notifications(qc),
  })
  const archiveMut = useMutation({
    mutationFn: archiveNotification,
    onSuccess: () => void invalidate.notifications(qc),
  })
  const archiveReadMut = useMutation({
    mutationFn: archiveReadNotifications,
    onSuccess: () => void invalidate.notifications(qc),
  })

  const selected =
    filtered.find((n) => n.id === selectedId) ??
    filtered[0] ??
    items.find((n) => n.id === selectedId) ??
    null

  const selectNotification = useCallback(
    (id: string) => {
      setSelectedId(id)
      const n = items.find((x) => x.id === id) ?? filtered.find((x) => x.id === id)
      if (n?.status === 'Unread') markReadMut.mutate(id)
    },
    [items, filtered, markReadMut],
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
    isLoading: inboxQuery.isLoading || allQuery.isLoading,
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
