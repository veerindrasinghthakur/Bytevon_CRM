import { useMemo, useState } from 'react'
import { teams, teamMetrics } from '../data/mock'
import type { Team } from '../types'

export function useTeamsList() {
  const [search, setSearch] = useState('')
  const [drawer, setDrawer] = useState<Team | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teams.filter(
      (t) => !q || t.name.toLowerCase().includes(q) || t.department.toLowerCase().includes(q),
    )
  }, [search])

  return {
    metrics: teamMetrics,
    totalCount: teams.length,
    filtered,
    search,
    setSearch,
    drawer,
    setDrawer,
    createOpen,
    setCreateOpen,
  }
}
