import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

export interface RowAction {
  id: string
  label: string
  icon?: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface RowActionsProps {
  actions: RowAction[]
  /** Accessible name for the trigger */
  label?: string
}

/**
 * Table row action menu (⋯). Opens a fixed menu; closes on outside click / Escape.
 * Use for Details / Edit / Archive instead of a single inline link.
 */
export function RowActions({ actions, label = 'Row actions' }: RowActionsProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        menuRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuWidth = 180
      let left = rect.right - menuWidth
      if (left < 8) left = 8
      setPos({ top: rect.bottom + 4, left })
    }
    setOpen((v) => !v)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[100] min-w-[180px] rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg py-1"
            style={{ top: pos.top, left: pos.left }}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-left text-body-md',
                  action.danger
                    ? 'text-error hover:bg-error/10'
                    : 'text-on-surface hover:bg-surface-container',
                  action.disabled && 'opacity-50 pointer-events-none'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  action.onClick()
                }}
              >
                {action.icon && (
                  <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                )}
                {action.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
