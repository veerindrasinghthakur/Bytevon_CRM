import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { useListSelection } from '@/shared/hooks/useListSelection'
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
import type { AppNotification, NotificationTab, NotificationTabId } from '../types'

export type { NotificationTabId }

const FILTER_DEFAULTS = {
  type: 'All',
  priority: 'All',
  module: 'All',
}

export function useNotificationCenter() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<NotificationTabId>('all')
  const [selectedId, setSelectedId] = useState<string>('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
    pagination: { pageSize: 100 },
  })

  const listParams = useMemo(
    () => ({
      search: controls.search || undefined,
      tab,
      typeFilter: controls.filters.type || 'All',
      priorityFilter: controls.filters.priority || 'All',
      moduleFilter: controls.filters.module || 'All',
      page: controls.page,
      pageSize: controls.pageSize,
    }),
    [
      controls.search,
      tab,
      controls.filters.type,
      controls.filters.priority,
      controls.filters.module,
      controls.page,
      controls.pageSize,
    ],
  )

  const inboxQuery = useQuery({
    queryKey: queryKeys.notifications.inbox(listParams),
    queryFn: () => listInboxNotifications(listParams),
    placeholderData: (prev) => prev,
  })

  const allQuery = useQuery({
    queryKey: queryKeys.notifications.inboxAll(),
    queryFn: listAllInboxNotifications,
  })

  const items = allQuery.data ?? []
  const filtered = inboxQuery.data?.items ?? []
  const total = inboxQuery.data?.total ?? filtered.length
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

  const selection = useListSelection<AppNotification>({
    items: filtered,
    getId: (n) => n.id,
  })

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
    query: controls.search,
    setQuery: controls.setSearch,
    typeFilter: controls.filters.type,
    setTypeFilter: (v: string) => controls.setFilter('type', v),
    priorityFilter: controls.filters.priority,
    setPriorityFilter: (v: string) => controls.setFilter('priority', v),
    moduleFilter: controls.filters.module,
    setModuleFilter: (v: string) => controls.setFilter('module', v),
    modules,
    filtered,
    items,
    total,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    markAllRead: () => markAllMut.mutate(),
    archiveRead: () => archiveReadMut.mutate(),
    markRead: (id: string) => markReadMut.mutate(id),
    archiveOne: (id: string) => archiveMut.mutate(id),
    menuOpenId,
    setMenuOpenId,
    selectionMode: selection.selectionMode,
    selectedIds: selection.selectedIds,
    selectedCount: selection.selectedCount,
    allFilteredSelected: selection.allFilteredSelected,
    toggleOne: selection.toggleOne,
    toggleSelectAllFiltered: selection.toggleSelectAllFiltered,
    exitSelectionMode: selection.exitSelectionMode,
    onRowPressStart: selection.onRowPressStart,
    onRowPressEnd: selection.onRowPressEnd,
    onRowPressCancel: selection.onRowPressCancel,
    isSelected: selection.isSelected,
  }
}
