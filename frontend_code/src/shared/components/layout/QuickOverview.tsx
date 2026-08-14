import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

export interface OverviewField {
  label: string
  value: string
}

export interface OverviewPayload {
  id: string | number
  title: string
  subtitle?: string
  badge?: string
  description?: string
  fields: OverviewField[]
  detailTo?: string
  detailParams?: Record<string, string>
  editTo?: string
  editParams?: Record<string, string>
}

interface QuickOverviewContextValue {
  item: OverviewPayload | null
  open: (item: OverviewPayload) => void
  close: () => void
}

const QuickOverviewContext = createContext<QuickOverviewContextValue | null>(null)

export function QuickOverviewProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<OverviewPayload | null>(null)
  const open = useCallback((next: OverviewPayload) => setItem(next), [])
  const close = useCallback(() => setItem(null), [])
  const value = useMemo(() => ({ item, open, close }), [item, open, close])
  return (
    <QuickOverviewContext.Provider value={value}>{children}</QuickOverviewContext.Provider>
  )
}

export function useQuickOverview() {
  const ctx = useContext(QuickOverviewContext)
  if (!ctx) {
    throw new Error('useQuickOverview must be used within QuickOverviewProvider')
  }
  return ctx
}

export function useQuickOverviewOptional() {
  return useContext(QuickOverviewContext)
}

export function QuickOverviewPanel() {
  const { item, close } = useQuickOverview()
  if (!item) return null

  return (
    <aside
      className={cn(
        'fixed right-0 z-40',
        'top-[56px] h-[calc(100vh-56px)]',
        'w-full max-w-[360px]',
        'border-l border-outline-variant bg-surface-container-lowest',
        'flex flex-col shadow-soft animate-slide-in-right'
      )}
      aria-label="Quick overview"
    >
      <div className="px-5 py-4 border-b border-outline-variant flex items-start justify-between gap-2 bg-surface-bright shrink-0">
        <div className="min-w-0">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
            Quick overview
          </p>
          <h3 className="text-title-lg text-on-background leading-snug">{item.title}</h3>
          {item.subtitle && (
            <p className="text-body-sm text-on-surface-variant mt-1">{item.subtitle}</p>
          )}
        </div>
        <button
          type="button"
          className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container shrink-0 transition-colors"
          aria-label="Close overview"
          onClick={close}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        {item.badge && (
          <span className="inline-flex px-2.5 py-1 rounded-full text-label-sm font-semibold bg-electric-blue/10 text-electric-blue">
            {item.badge}
          </span>
        )}
        {item.description && (
          <p className="text-body-sm text-on-surface-variant leading-relaxed">{item.description}</p>
        )}
        <dl className="space-y-3 text-body-sm">
          {item.fields.map((f) => (
            <div key={f.label} className="flex justify-between gap-3">
              <dt className="text-on-surface-variant shrink-0">{f.label}</dt>
              <dd className="text-on-background font-medium text-right">{f.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="p-4 border-t border-outline-variant flex flex-col gap-2 bg-surface-bright shrink-0">
        {item.detailTo && (
          <Link to={item.detailTo} params={item.detailParams} onClick={close} className="block">
            <Button variant="primary" size="sm" className="w-full">
              View full
            </Button>
          </Link>
        )}
        <div className="grid grid-cols-2 gap-2">
          {item.editTo && (
            <Link
              to={item.editTo}
              params={item.editParams}
              search={{ edit: '1' }}
              onClick={close}
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full">
                Edit
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" className="w-full text-error" onClick={close}>
            Close
          </Button>
        </div>
      </div>
    </aside>
  )
}
