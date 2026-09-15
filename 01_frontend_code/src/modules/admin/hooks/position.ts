/**
 * Compatibility entry — prefer importing from './position/use-positions'.
 * Do NOT use '../../api/position' from this file (that resolves outside admin).
 * Correct relative path to API is '../api/position' (see use-positions.ts).
 */
export { usePositions, usePositionDetail } from './position/use-positions'
export type { PositionRow } from './position/use-positions'
