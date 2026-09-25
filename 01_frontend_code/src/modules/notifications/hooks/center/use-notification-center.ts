import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { useListSelection } from '@/shared/hooks/useListSelection'
import {
  archiveNotification,
  archiveReadNotifications,
  computeInboxKpis,
  deleteNotification,
  listAllInboxNotifications,
  listInboxNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/center'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'
import type { AppNotification, NotificationTab, NotificationTabId } from '../../types'

function isRow(value: unknown): value is AppNotification {
  return typeof value === 'object' && value !== null && 'id' in value && 'status' in value
}

/** Instantly reflect a status change across every cached inbox/detail query. */
function patchCachedStatus(
  qc: ReturnType<typeof useQueryClient>,
  id: string | null,
  status: AppNotification['status'] | null,
  remove = false,
  from: AppNotification['status'] | null = null,
) {
  const apply = (n: unknown): unknown => {
    if (!isRow(n)) return n
    if (id !== null && String(n.id) !== id) return n
    if (from !== null && n.status !== from) return n
    return { ...n, status: status ?? n.status }
  }
  qc.setQueriesData({ queryKey: queryKeys.notifications.all }, (old: unknown) => {
    if (Array.isArray(old)) {
      const next = (old as unknown[]).map(apply)
      return remove && id !== null
        ? next.filter((n) => !(isRow(n) && String(n.id) === id))
        : next
    }
    if (old && typeof old === 'object' && 'items' in old && Array.isArray((old as { items: unknown }).items)) {
      const items = (old as { items: unknown[] }).items.map(apply)
      const visible =
        remove && id !== null
          ? items.filter((n) => !(isRow(n) && String(n.id) === id))
          : items
      return { ...old, items: visible }
    }
    if (isRow(old) && id !== null && String(old.id) === id) {
      return apply(old)
    }
    return old
  })
}

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
    onMutate: (id) => patchCachedStatus(qc, id, 'Read'),
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not mark as read'))
      void invalidate.notifications(qc)
    },
    onSuccess: () => void invalidate.notifications(qc),
  })
  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: () => patchCachedStatus(qc, null, 'Read', false, 'Unread'),
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not mark all as read'))
      void invalidate.notifications(qc)
    },
    onSuccess: () => void invalidate.notifications(qc),
  })
  const archiveMut = useMutation({
    mutationFn: archiveNotification,
    onMutate: (id) => patchCachedStatus(qc, id, 'Archived'),
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not archive'))
      void invalidate.notifications(qc)
    },
    onSuccess: () => void invalidate.notifications(qc),
  })
  const archiveReadMut = useMutation({
    mutationFn: archiveReadNotifications,
    onMutate: () => patchCachedStatus(qc, null, 'Archived', false, 'Read'),
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not archive read items'))
      void invalidate.notifications(qc)
    },
    onSuccess: () => void invalidate.notifications(qc),
  })
  const deleteMut = useMutation({
    mutationFn: deleteNotification,
    onMutate: (id) => patchCachedStatus(qc, id, null, true),
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not delete'))
      void invalidate.notifications(qc)
    },
    onSuccess: () => {
      setMenuOpenId(null)
      void invalidate.notifications(qc)
    },
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
    markReadPending: markReadMut.isPending,
    archiveOne: (id: string) => archiveMut.mutate(id),
    deleteOne: (id: string) => deleteMut.mutate(id),
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
