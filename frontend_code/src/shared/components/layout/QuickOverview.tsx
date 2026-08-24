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
import { IconButton } from '@/shared/components/ui/IconButton'
import { OpenQuickOverviewOptions, QuickOverviewContextValue } from '@/shared/types'

/** Gap between panel and viewport edges (below header / above bottom) */
const PANEL_EDGE_GAP_PX = 4
const EXIT_MS = 280

const QuickOverviewContext = createContext<QuickOverviewContextValue | null>(null)

export function useQuickOverview() {
  const ctx = useContext(QuickOverviewContext)
  if (!ctx) throw new Error('useQuickOverview must be used within QuickOverviewProvider')
  return ctx
}

export function QuickOverviewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<OpenQuickOverviewOptions | null>(null)
  const [visible, setVisible] = useState(false)

  const openPanel = useCallback((opts: OpenQuickOverviewOptions) => {
    setOptions(opts)
    setVisible(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true))
    })
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen && visible) {
      const t = window.setTimeout(() => {
        setVisible(false)
        setOptions(null)
      }, EXIT_MS)
      return () => window.clearTimeout(t)
    }
  }, [isOpen, visible])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closePanel])

  const value = useMemo<QuickOverviewContextValue>(
    () => ({
      isOpen,
      openPanel,
      open: openPanel,
      closePanel,
    }),
    [isOpen, openPanel, closePanel],
  )

  return (
    <QuickOverviewContext.Provider value={value}>
      {children}
      <QuickOverviewPanelShell
        isOpen={isOpen}
        visible={visible}
        options={options}
        onClose={closePanel}
      />
    </QuickOverviewContext.Provider>
  )
}

function QuickOverviewPanelShell({
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

  const widthClass = options.widthClass ?? 'max-w-[520px]'
  const fullLabel = options.fullRecordLabel ?? 'Open full record'
  const iconName = options.icon ?? 'info'

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      style={{ top: HEADER_HEIGHT_PX }}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 border-0 cursor-default',
          'bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Close overview"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={options.title}
        className={cn(
          'absolute right-0 w-full flex flex-col overflow-hidden',
          'bg-surface-container-lowest border-l border-outline-variant shadow-2xl',
          'rounded-l-xl',
          widthClass,
          isOpen ? 'animate-slide-in-right' : 'animate-slide-out-right',
        )}
        style={{
          top: PANEL_EDGE_GAP_PX,
          bottom: PANEL_EDGE_GAP_PX,
          height: `calc(100% - ${PANEL_EDGE_GAP_PX * 2}px)`,
        }}
      >
        <header className="flex items-start justify-between gap-3 p-6 border-b border-outline-variant shrink-0 bg-surface-container-lowest rounded-tl-xl">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]" aria-hidden>
                {iconName}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-headline-md font-semibold text-on-surface truncate">{options.title}</h2>
                {options.status && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-label-sm font-medium border border-outline-variant shrink-0">
                    <span
                      className={cn('w-2 h-2 rounded-full', options.statusDotClass ?? 'bg-secondary')}
                      aria-hidden
                    />
                    {options.status}
                  </span>
                )}
              </div>
              {options.subtitle && (
                <p className="text-body-sm text-on-surface-variant truncate">{options.subtitle}</p>
              )}
            </div>
          </div>
          <IconButton label="Close panel" size="sm" onClick={onClose}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0 bg-background">{options.content}</div>

        <footer className="p-6 border-t border-outline-variant bg-surface-container-lowest shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {options.onEdit && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
                onClick={() => {
                  onClose()
                  window.setTimeout(() => options.onEdit?.(), 80)
                }}
              >
                {options.editLabel ?? 'Edit'}
              </Button>
            )}
            {options.secondaryLabel && options.onSecondary && (
              <Button variant="outline" size="sm" onClick={options.onSecondary}>
                {options.secondaryLabel}
              </Button>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {options.onOpenFull && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-[18px]">open_in_new</span>}
                onClick={() => {
                  onClose()
                  window.setTimeout(() => options.onOpenFull?.(), 80)
                }}
              >
                {fullLabel}
              </Button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  )
}

/** @deprecated Panel is rendered by the provider */
export function QuickOverviewPanel() {
  return null
}
