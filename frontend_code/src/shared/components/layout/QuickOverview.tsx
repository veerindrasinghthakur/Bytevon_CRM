import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { HEADER_HEIGHT_PX } from './Header'
import { Button } from '@/shared/components/ui/Button'

/** Gap between panel and viewport edges (below header / above bottom) */
const PANEL_EDGE_GAP_PX = 12

export type OpenQuickOverviewOptions = {
  /** Header title in the panel chrome */
  title: string
  /** Page-specific body (cards, fields, etc.) */
  content: ReactNode
  /** Primary footer CTA — typically navigate to full detail */
  onOpenFull?: () => void
  fullRecordLabel?: string
  /** Optional secondary footer action */
  secondaryLabel?: string
  onSecondary?: () => void
  /** Tailwind max-width class for the drawer (page can override) */
  widthClass?: string
}

interface QuickOverviewContextValue {
  open: boolean
  openPanel: (options: OpenQuickOverviewOptions) => void
  closePanel: () => void
  /** @deprecated prefer openPanel — alias for ProjectsListPage compatibility */
  open: (options: OpenQuickOverviewOptions) => void
}

const QuickOverviewContext = createContext<QuickOverviewContextValue | null>(null)

export function useQuickOverview() {
  const ctx = useContext(QuickOverviewContext)
  if (!ctx) throw new Error('useQuickOverview must be used within QuickOverviewProvider')
  return ctx
}

export function QuickOverviewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<OpenQuickOverviewOptions | null>(null)
  /** Keep content mounted during exit animation */
  const [visible, setVisible] = useState(false)

  const openPanel = useCallback((opts: OpenQuickOverviewOptions) => {
    setOptions(opts)
    setIsOpen(true)
    setVisible(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  // After close transition, unmount content
  useEffect(() => {
    if (!isOpen && visible) {
      const t = window.setTimeout(() => {
        setVisible(false)
        setOptions(null)
      }, 280)
      return () => window.clearTimeout(t)
    }
  }, [isOpen, visible])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closePanel])

  const value = useMemo(
    () => ({
      open: isOpen,
      openPanel,
      closePanel,
      // alias used by ProjectsListPage
      open: openPanel as unknown as boolean & ((o: OpenQuickOverviewOptions) => void),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional dual open API
    [isOpen, openPanel, closePanel],
  )

  // Fix dual `open` key properly
  const ctxValue = useMemo<QuickOverviewContextValue>(
    () => ({
      open: isOpen,
      openPanel,
      closePanel,
      open: ((opts: OpenQuickOverviewOptions) => openPanel(opts)) as QuickOverviewContextValue['open'],
    }),
    [isOpen, openPanel, closePanel],
  )

  return (
    <QuickOverviewContext.Provider value={ctxValue}>
      {children}
      <QuickOverviewPanel
        isOpen={isOpen}
        visible={visible}
        options={options}
        onClose={closePanel}
      />
    </QuickOverviewContext.Provider>
  )
}

function QuickOverviewPanel({
  isOpen,
  visible,
  options,
  onClose,
}: {
  isOpen: boolean
  visible: boolean
  options: OpenQuickOverviewOptions | null
  onClose: () => void
}) {
  if (!visible || !options) return null

  const widthClass = options.widthClass ?? 'max-w-md'
  const fullLabel = options.fullRecordLabel ?? 'Open full record'

  return (
    <div
      className={cn(
        'fixed inset-0 z-40',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop — blurs page content; does not cover header (starts below it) */}
      <button
        type="button"
        className={cn(
          'absolute left-0 right-0 bottom-0 border-0 cursor-default',
          'bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        style={{ top: HEADER_HEIGHT_PX }}
        aria-label="Close overview"
        onClick={onClose}
      />

      {/* Drawer — between header and bottom, page-controlled width */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={options.title}
        className={cn(
          'absolute right-0 w-full flex flex-col overflow-hidden',
          'bg-surface-container-lowest border-l border-outline-variant shadow-2xl',
          'rounded-l-xl',
          widthClass,
          isOpen ? 'animate-slide-in-right' : 'translate-x-full transition-transform duration-300',
        )}
        style={{
          top: HEADER_HEIGHT_PX + PANEL_EDGE_GAP_PX,
          bottom: PANEL_EDGE_GAP_PX,
          height: `calc(100vh - ${HEADER_HEIGHT_PX + PANEL_EDGE_GAP_PX * 2}px)`,
        }}
      >
        {/* Chrome header */}
        <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-secondary shrink-0" aria-hidden>
              info
            </span>
            <span className="truncate">{options.title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors shrink-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Page-specific body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">{options.content}</div>

        {/* Shared footer actions — same pattern as Clients / Leads quick view */}
        <div className="p-6 border-t border-outline-variant bg-surface-container-low flex gap-3 shrink-0">
          {options.onOpenFull && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                onClose()
                options.onOpenFull?.()
              }}
            >
              {fullLabel}
            </Button>
          )}
          {options.secondaryLabel && options.onSecondary && (
            <Button variant="outline" onClick={options.onSecondary}>
              {options.secondaryLabel}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </aside>
    </div>
  )
}
