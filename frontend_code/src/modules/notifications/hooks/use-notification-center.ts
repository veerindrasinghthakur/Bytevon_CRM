import { useMemo, useState } from 'react'
import { inboxNotifications, notificationKpis } from '../data/mock'
import type { NotificationTabId, NotificationTab } from '../types'

export type { NotificationTabId }

export function useNotificationCenter() {
  const [tab, setTab] = useState<NotificationTabId>('all')
  const [selectedId, setSelectedId] = useState(inboxNotifications[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [items, setItems] = useState(inboxNotifications)

  const unreadCount = items.filter((n) => n.status === 'Unread').length
  const highCount = items.filter((n) => n.priority === 'High' || n.priority === 'Critical').length

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
      if (typeFilter === 'Mention' && !n.body.includes('@')) return false
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

  const selected = filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, status: n.status === 'Archived' ? n.status : 'Read' })))
  }

  const archiveRead = () => {
    setItems((prev) => prev.map((n) => (n.status === 'Read' ? { ...n, status: 'Archived' as const } : n)))
  }

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'Read' as const } : n)))
  }

  const archiveOne = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'Archived' as const } : n)))
  }

  const selectNotification = (id: string) => {
    setSelectedId(id)
    const n = items.find((x) => x.id === id)
    if (n?.status === 'Unread') markRead(id)
  }

  const tabs: NotificationTab[] = [
    { id: 'all', label: `All (${items.length})` },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'mentions', label: 'Mentions (0)' },
    { id: 'high', label: `High Priority (${highCount})` },
    { id: 'archived', label: 'Archived' },
  ]

  const modules = Array.from(new Set(items.map((n) => n.module)))

  return {
    kpis: notificationKpis,
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
    markAllRead,
    archiveRead,
    markRead,
    archiveOne,
  }
}
