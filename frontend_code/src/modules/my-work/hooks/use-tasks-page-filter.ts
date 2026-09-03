import { useState } from 'react'

import {TaskFilter} from '../schemas/enums'

export function useTasksPageFilter() {
  const [cardFilter, setCardFilter] = useState<TaskFilter>(null)

  return {
    cardFilter,
    setCardFilter,
  }
}