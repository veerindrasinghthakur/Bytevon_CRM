/**
 * Minimal toast store — no external dependency.
 * Mount <ToastHost /> once under AppProviders to render toasts.
 */
import { useSyncExternalStore, useCallback } from 'react'

export type ToastTone = 'info' | 'success' | 'error'

export type ToastItem = {
  id: string
  message: string
  tone: ToastTone
  createdAt: number
}

let toasts: ToastItem[] = []
const listeners = new Set<() => void>()
let seq = 0

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return toasts
}

function push(message: string, tone: ToastTone = 'info', ttlMs = 4000) {
  const id = `t-${++seq}-${Date.now()}`
  toasts = [...toasts, { id, message, tone, createdAt: Date.now() }]
  emit()
  if (ttlMs > 0) {
    window.setTimeout(() => dismiss(id), ttlMs)
  }
  return id
}

function dismiss(id: string) {
  const next = toasts.filter((t) => t.id !== id)
  if (next.length !== toasts.length) {
    toasts = next
    emit()
  }
}

export function useToast() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const success = useCallback((message: string) => push(message, 'success'), [])
  const error = useCallback((message: string) => push(message, 'error', 6000), [])
  const info = useCallback((message: string) => push(message, 'info'), [])

  return {
    toasts: items,
    success,
    error,
    info,
    dismiss,
  }
}

/** Imperative helpers when hooks are awkward (e.g. inside mutation factories). */
export const toast = {
  success: (message: string) => push(message, 'success'),
  error: (message: string) => push(message, 'error', 6000),
  info: (message: string) => push(message, 'info'),
  dismiss,
}
