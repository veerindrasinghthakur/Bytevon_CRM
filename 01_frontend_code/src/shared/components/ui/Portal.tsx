import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Render overlay content at document.body so `fixed` positioning escapes
 * transformed ancestors (e.g. animate-fade-in pages) and stacking contexts
 * of the AppShell sidebar/header.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [el] = useState(() => document.createElement('div'))
  useEffect(() => {
    document.body.appendChild(el)
    return () => {
      document.body.removeChild(el)
    }
  }, [el])
  return createPortal(children, el)
}
