/** Types and utilities for the working hours log timeline visualization */

import type { WorkLogRow, BreakSeg } from '../schemas/working-hours-log'

// Re-export types for backward compatibility
export type { WorkLogRow, BreakSeg }

/** Percent of 24h day for timeline marker (0–100). */
export function dayPct(iso: string, now = Date.now()): number {
  const d = new Date(iso)
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const ms = Math.min(now, d.getTime()) - start.getTime()
  return Math.min(100, Math.max(0, (ms / 86_400_000) * 100))
}
