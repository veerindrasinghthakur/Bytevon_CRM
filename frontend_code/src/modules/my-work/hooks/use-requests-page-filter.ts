import { useState } from 'react'

type RequestFilter = 'All Requests' | 'In-Progress' | 'Approved' | 'Rejected'

export function useRequestsPageFilter() {
  const [filter, setFilter] = useState<RequestFilter>('All Requests')

  return {
    filter,
    setFilter,
  }
}