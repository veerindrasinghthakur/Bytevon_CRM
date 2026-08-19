import { createContext, useContext } from 'react'

export const LeaveEditContext = createContext<{
  editing: boolean
  setEditing: (v: boolean) => void
}>({ editing: false, setEditing: () => {} })

export function useLeaveEdit() {
  return useContext(LeaveEditContext)
}
