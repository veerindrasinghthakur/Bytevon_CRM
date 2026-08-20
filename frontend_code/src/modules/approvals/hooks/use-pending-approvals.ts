import { useMemo, useState } from 'react'
import { pendingApprovals } from '../data/mock'

export function usePendingApprovals() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return pendingApprovals.filter((r) => {
      const matchQ =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.requester.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      const matchType = typeFilter === 'All' || r.type === typeFilter
      const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter
      return matchQ && matchType && matchPriority
    })
  }, [search, typeFilter, priorityFilter])

  const types = useMemo(
    () => Array.from(new Set(pendingApprovals.map((r) => r.type))).sort(),
    [],
  )

  return {
    items: pendingApprovals,
    filtered,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    priorityFilter,
    setPriorityFilter,
    types,
  }
}
