import type { KeyboardEvent } from 'react'

const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button[type="submit"]:not([disabled])',
].join(',')

function isTextarea(el: Element): boolean {
  return el instanceof HTMLTextAreaElement
}

/**
 * Enter advances to the next step in a form:
 * - Explicit `nextFocusId` → focus that element.
 * - Otherwise → next focusable field in the same form (skips checkbox/radio).
 * - On last field (or when next is submit) → requestSubmit().
 *
 * Textareas: Enter inserts newline (no advance). Use Ctrl/Cmd+Enter to submit.
 */
export function handleEnterAdvance(
  e: KeyboardEvent<HTMLElement>,
  nextFocusId?: string
): void {
  if (e.key !== 'Enter') return
  if (e.nativeEvent.isComposing) return

  const current = e.currentTarget as HTMLElement

  // Textarea: allow newline; Ctrl/Cmd+Enter submits
  if (isTextarea(current)) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const form = current.closest('form')
      form?.requestSubmit?.()
    }
    return
  }

  e.preventDefault()

  if (nextFocusId) {
    const next = document.getElementById(nextFocusId)
    if (next) {
      next.focus()
      if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) {
        next.select?.()
      }
      return
    }
  }

  const form = current.closest('form')
  if (!form) return

  const fields = Array.from(form.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  )

  const idx = fields.indexOf(current)
  if (idx === -1) {
    form.requestSubmit?.()
    return
  }

  // Walk forward to next useful control
  for (let i = idx + 1; i < fields.length; i++) {
    const candidate = fields[i]
    if (candidate instanceof HTMLButtonElement && candidate.type === 'submit') {
      form.requestSubmit?.()
      return
    }
    candidate.focus()
    if (candidate instanceof HTMLInputElement || candidate instanceof HTMLTextAreaElement) {
      candidate.select?.()
    }
    return
  }

  // No more fields → submit
  form.requestSubmit?.()
}

/** Convenience props factory */
export function enterAdvanceProps(nextFocusId?: string) {
  return {
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => handleEnterAdvance(e, nextFocusId),
  }
}
