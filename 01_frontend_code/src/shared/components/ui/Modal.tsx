import { useEffect } from 'react'
import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'
import { Portal } from './Portal'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
  danger?: boolean
  wide?: boolean
  closeOnEscape?: boolean
}

export function Modal({ title, children, onClose, danger, wide, closeOnEscape = true }: ModalProps) {
  useEffect(() => {
    if (!closeOnEscape) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeOnEscape, onClose])

  return (
    <Portal>
      <div className="fixed inset-0 modal-overlay z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className={cn('bv-surface executive-shadow w-full my-auto', wide ? 'max-w-2xl' : 'max-w-md')}>
          <div
            className={cn(
              'px-6 py-4 border-b border-outline-variant flex items-center justify-between',
              danger && 'bg-error/5',
            )}
          >
            <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
              {danger && <span className="material-symbols-outlined text-error">warning</span>}
              {title}
            </h3>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-surface-container transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </Portal>
  )
}