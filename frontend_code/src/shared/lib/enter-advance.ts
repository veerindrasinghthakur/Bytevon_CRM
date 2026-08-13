import type { KeyboardEvent } from 'react'

/**
 * Enter advances to the next step in a form:
 * - If `nextFocusId` is set → focus that element (next field).
 * - If omitted → submit the nearest form (final step / primary action).
 *
 * Use on text/password/email/number inputs. Do not attach to textarea if
 * multi-line Enter should insert a newline.
 */
export function handleEnterAdvance(
  e: KeyboardEvent<HTMLElement>,
  nextFocusId?: string
): void {
  if (e.key !== 'Enter') return
  // Allow IME composition to finish
  if (e.nativeEvent.isComposing) return

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

  const form = (e.currentTarget as HTMLElement).closest('form')
  if (form) {
    // Prefer requestSubmit so React onSubmit + validation still run
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit()
    } else {
      form.submit()
    }
  }
}

/** Convenience props factory for react-hook-form register merge */
export function enterAdvanceProps(nextFocusId?: string) {
  return {
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => handleEnterAdvance(e, nextFocusId),
  }
}
