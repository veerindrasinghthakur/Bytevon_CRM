import { useState } from 'react'

type Tab = 'balance' | 'history' | 'calendar'

export function useLeavePageState() {
  const [tab, setTab] = useState<Tab>('balance')
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  return {
    tab,
    setTab,
    calMonth,
    setCalMonth,
  }
}