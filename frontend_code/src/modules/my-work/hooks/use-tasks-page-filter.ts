import { useState } from 'react'

type TaskFilter = 'open' | 'inProgress' | 'high' | null

export function useTasksPageFilter() {
  const [cardFilter, setCardFilter] = useState<TaskFilter>(null)

  return {
    cardFilter,
    setCardFilter,
  }
}