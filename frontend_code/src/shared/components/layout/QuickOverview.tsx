import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { HEADER_HEIGHT_PX } from './Header'

interface QuickOverviewContextValue {
  open: boolean
  content: ReactNode
  title: string
  openPanel: (title: string, content: ReactNode) => void
  closePanel: () => void
}

const QuickOverviewContext = createContext<QuickOverviewContextValue | null>(null)

export function useQuickOverview() {
  const ctx = useContext(QuickOverviewContext)
  if (!ctx) throw new Error('useQuickOverview must be used within QuickOverviewProvider')
  return ctx
}

export function QuickOverviewProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<ReactNode>(null)
  const [title, setTitle] = useState('Overview')

  const openPanel = useCallback((t: string, c: ReactNode) => {
    setTitle(t)
    setContent(c)
    setOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({ open, content, title, openPanel, closePanel }),
    [open, content, title, openPanel, closePanel],
  )

  return <QuickOverviewContext.Provider value={value}>{children}</QuickOverviewContext.Provider>
}

/**
 * Contextual Detail Drawer (Overview Panel)
 *
 * - Not permanent — appears only when user clicks a data item (card/row)
 * - Drawer-based, slides in from the right
 * - Height strictly between App Header and bottom of viewport (footer if present)
 * - One drawer at a time; selecting another item updates content
 * - Used across Employees, Projects, Departments, Tasks, Leads, Clients, etc.
 */
export function QuickOverviewPanel() {
  const { open, content, title, closePanel } = useQuickOverview()

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition-opacity duration-slow',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
    >
      {/* Full-screen backdrop for outside-click close */}
      <button
        type="button"
        className="absolute inset-0 modal-overlay cursor-default border-0"
        aria-label="Close overview"
        onClick={closePanel}
      />

      {/* Drawer panel — constrained between header and footer */}
      <aside
        className={cn(
          'absolute right-0 w-full max-w-md',
          'bg-surface-container-lowest border-l border-outline-variant/30 shadow-drawer',
          'flex flex-col',
          open ? 'animate-slide-in-right' : 'translate-x-full',
        )}
        style={{
          top: HEADER_HEIGHT_PX,
          height: `calc(100vh - ${HEADER_HEIGHT_PX}px)`,
        }}
      >
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-bright shrink-0">
          <h3 className="text-headline-md font-semibold text-deep-navy">{title}</h3>
          <button type="button" onClick={closePanel} className="bv-icon-btn" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{content}</div>
      </aside>
    </div>
  )
}
