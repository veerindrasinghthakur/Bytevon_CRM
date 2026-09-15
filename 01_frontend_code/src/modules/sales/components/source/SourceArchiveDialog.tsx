import { Button } from '@/shared/components/ui/Button'
import type { LeadSource } from '../../api/source'

type Props = {
  target: LeadSource
  busy: boolean
  actionError: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function SourceArchiveDialog({ target, busy, actionError, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm bv-surface p-6 shadow-xl space-y-4" role="dialog" aria-modal="true">
        <h2 className="text-title-md font-semibold">Archive source?</h2>
        <p className="text-body-sm text-on-surface-variant">
          “{target.name}” will be hidden from new lead pickers. Existing leads keep their link.
        </p>
        {actionError && (
          <p className="text-body-sm text-error" role="alert">
            {actionError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={busy} onClick={onConfirm}>
            {busy ? 'Archiving…' : 'Confirm archive'}
          </Button>
        </div>
      </div>
    </div>
  )
}
