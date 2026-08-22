import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { computeSentKpis, listSentNotifications } from '../api/notifications'

export function useSentNotifications() {
  const query = useQuery({
    queryKey: ['notifications', 'sent'],
    queryFn: listSentNotifications,
  })
  const rows = query.data ?? []

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (typeFilter !== 'All' && r.type !== typeFilter) return false
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          r.recipientName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.recipientContact.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [rows, search, typeFilter, statusFilter])

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('All')
    setStatusFilter('All')
  }

  return {
    isLoading: query.isLoading,
    kpis: computeSentKpis(rows),
    rows: filtered,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    resetFilters,
    filtersActive: Boolean(search) || typeFilter !== 'All' || statusFilter !== 'All',
  }
}
