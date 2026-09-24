import { Button } from './Button'
import { Modal } from './Modal'

export type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Generic in-app confirmation dialog (replaces window.confirm).
 * Import from `@/shared/components/ui/ConfirmDialog`.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  isLoading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose} danger={danger}>
      <div className="space-y-4">
        <p className="text-body-sm text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={isLoading} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
