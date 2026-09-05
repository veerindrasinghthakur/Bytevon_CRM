import { useEffect, useState } from 'react'
import {
  formatClockTime,
  formatHoursCompact,
  getWorkHoursSummary,
  subscribeAttendanceChange,
  type WorkHoursSummary,
} from '@/modules/my-work/lib/attendance-session'
import { subscribeBreakChange } from '@/modules/my-work/lib/break-session'

/** Header attendance strip — check-in/out + net work hours (excludes breaks). */
export function useHeaderAttendance() {
  const [summary, setSummary] = useState<WorkHoursSummary | null>(() => getWorkHoursSummary())

  useEffect(() => {
    const refresh = () => setSummary(getWorkHoursSummary())
    refresh()
    const id = window.setInterval(refresh, 1000)
    const unsubA = subscribeAttendanceChange(refresh)
    const unsubB = subscribeBreakChange(refresh)
    return () => {
      window.clearInterval(id)
      unsubA()
      unsubB()
    }
  }, [])

  return {
    summary,
    checkedIn: Boolean(summary?.checkInAt),
    checkedOut: Boolean(summary?.checkOutAt),
    formatClockTime,
    formatHoursCompact,
  }
}
