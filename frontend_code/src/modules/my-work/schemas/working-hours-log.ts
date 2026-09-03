/** Types for the working hours log timeline visualization */

export type WorkLogRow = {
  id: string
  activity: string
  time: string
  duration: string
  statusLabel: string
  statusTone: 'ok' | 'warn' | 'neutral'
  location: string
}

export type BreakSeg = {
  id: string
  startedAt: string
  endedAt?: string | null
}
