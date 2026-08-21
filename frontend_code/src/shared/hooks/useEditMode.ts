import { useCallback, useState } from 'react'

export interface UseEditModeResult {
  isEditing: boolean
  startEditing: () => void
  cancelEditing: () => void
  /** Call after a successful save mutation */
  finishEditing: () => void
  setEditing: (value: boolean) => void
}

/**
 * UI-only edit mode (view ↔ edit). Does not own API mutations.
 * Pair with useMutation: on success → finishEditing().
 */
export function useEditMode(initial = false): UseEditModeResult {
  const [isEditing, setEditing] = useState(initial)

  const startEditing = useCallback(() => setEditing(true), [])
  const cancelEditing = useCallback(() => setEditing(false), [])
  const finishEditing = useCallback(() => setEditing(false), [])

  return { isEditing, startEditing, cancelEditing, finishEditing, setEditing }
}
