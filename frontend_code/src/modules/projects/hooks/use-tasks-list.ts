import { useMemo, useState } from 'react'
import { useTasks } from './use-tasks'

export function useTasksList(projectId?: number) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isLoading, isError, refetch } = useTasks(
    projectId != null ? { projectId } : undefined,
  )

  const items = data?.items ?? []

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((t) => {
      const matchQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.assigneeName?.toLowerCase().includes(q) ?? false)
      const matchStatus = !status || t.status === status
      return matchQ && matchStatus
    })
  }, [items, search, status])

  return {
    items,
    filtered,
    search,
    setSearch,
    status,
    setStatus,
    isLoading,
    isError,
    refetch,
  }
}
