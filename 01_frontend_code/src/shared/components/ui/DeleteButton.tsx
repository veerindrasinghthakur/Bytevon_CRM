import { useState } from 'react'
import { Button } from './Button'
import { cn } from '@/shared/lib/cn'


export type DeleteButtonProps = {
  /** Entity label shown in confirmation (e.g. user name) */
  entityLabel?: string
  /** Called after user confirms */
  onConfirm: () => void | Promise<void>
  disabled?: boolean
  isLoading?: boolean
  className?: string
  size?: 'sm' | 'md'
  /** Optional custom trigger label */
  label?: string
  /** When true, renders bin icon only (no text) with aria-label + tooltip */
  iconOnly?: boolean
}

/**
 * Shared delete control with confirm dialog.
 * Import from `@/shared/components/ui/DeleteButton` on any detail page.
 */
export function DeleteButton({
  entityLabel = 'this record',
  onConfirm,
  disabled,
  isLoading,
  className,
  size = 'sm',
  label,
  iconOnly = false,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const action = label ?? 'Delete'

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (iconOnly) {
    return (
      <>
        <button
          type="button"
          disabled={disabled || isLoading}
          aria-label={`Delete ${entityLabel}`}
          title={`Delete ${entityLabel}`}
          onClick={() => setOpen(true)}
          className={cn(
            'p-2 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors disabled:opacity-50',
            className,
          )}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden>
            delete
          </span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40" onClick={() => !busy && setOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bv-surface executive-shadow w-full max-w-md">
                <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-error/5">
                  <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                    <span className="material-symbols-outlined text-error">warning</span>
                    Delete {entityLabel}?
                  </h3>
                  <button
                    type="button"
                    className="p-1 rounded-lg hover:bg-surface-container"
                    onClick={() => !busy && setOpen(false)}
                    aria-label="Close"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-body-sm text-on-surface-variant">
                    This removes {entityLabel}. This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-error text-error"
                      isLoading={busy || isLoading}
                      onClick={() => void handleConfirm()}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size={size}
        disabled={disabled || isLoading}
        className={cn('border-error text-error hover:bg-error/10', className)}
        leftIcon={
          <span className="material-symbols-outlined text-[18px]">
            delete
          </span>
        }
        onClick={() => setOpen(true)}
      >
        {action}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40" onClick={() => !busy && setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bv-surface executive-shadow w-full max-w-md">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-error/5">
                <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">warning</span>
                  Delete {entityLabel}?
                </h3>
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-surface-container"
                  onClick={() => !busy && setOpen(false)}
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-body-sm text-on-surface-variant">
                  This permanently removes {entityLabel}. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-error text-error"
                    isLoading={busy || isLoading}
                    onClick={() => void handleConfirm()}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}