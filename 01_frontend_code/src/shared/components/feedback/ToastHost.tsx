import { useToast } from '@/shared/hooks/use-toast'
import { cn } from '@/shared/lib/cn'

const toneClass: Record<string, string> = {
  success: 'border-[var(--color-success-emerald)]/40 bg-[var(--color-success-emerald)]/10 text-on-background',
  error: 'border-error/40 bg-error/10 text-on-background',
  info: 'border-outline-variant bg-surface-container-high text-on-background',
}

/**
 * Mount once near the app root (e.g. inside AppProviders).
 */
export function ToastHost() {
  const { toasts, dismiss } = useToast()

  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-lg border px-4 py-3 shadow-lg text-body-sm flex items-start gap-3',
            toneClass[t.tone] ?? toneClass.info,
          )}
          role="status"
        >
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            className="text-on-surface-variant hover:text-on-surface shrink-0"
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
