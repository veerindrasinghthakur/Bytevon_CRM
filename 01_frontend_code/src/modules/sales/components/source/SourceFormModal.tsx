import { Button } from '@/shared/components/ui/Button'

type ModalMode = 'create' | 'edit'
type ConfirmKind = 'save' | 'cancel' | null

type Props = {
  mode: ModalMode
  name: string
  description: string
  formError: string | null
  confirmKind: ConfirmKind
  busy: boolean
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onRequestSave: () => void
  onRequestCancel: () => void
  onBackFromConfirm: () => void
  onConfirmSave: () => void
  onConfirmDiscard: () => void
}

export function SourceFormModal({
  mode,
  name,
  description,
  formError,
  confirmKind,
  busy,
  onNameChange,
  onDescriptionChange,
  onRequestSave,
  onRequestCancel,
  onBackFromConfirm,
  onConfirmSave,
  onConfirmDiscard,
}: Props) {
  return (
    <div className="space-y-4" role="dialog" aria-modal="true" aria-labelledby="source-modal-title">
      <p className="text-body-sm text-on-surface-variant">
        Sources map to the platforms table and appear in the lead Source picker.
      </p>

        {confirmKind === 'save' || confirmKind === 'cancel' ? (
          <div className="space-y-4">
            <p className="text-body-md text-on-surface">
              {confirmKind === 'save'
                ? mode === 'create'
                  ? `Create source “${name.trim()}”?`
                  : `Save changes to “${name.trim()}”?`
                : 'Discard changes and close?'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={onBackFromConfirm}>
                Back
              </Button>
              {confirmKind === 'cancel' ? (
                <Button variant="primary" size="sm" onClick={onConfirmDiscard}>
                  Discard
                </Button>
              ) : (
                <Button variant="primary" size="sm" disabled={busy} onClick={onConfirmSave}>
                  {busy ? 'Saving…' : 'Confirm'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Name</span>
                <input
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  maxLength={150}
                  placeholder="e.g. Website, LinkedIn"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Description
                </span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 min-h-[80px]"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Optional notes"
                />
              </label>
              {formError && (
                <p className="text-body-sm text-error" role="alert">
                  {formError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onRequestCancel} disabled={busy}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={onRequestSave} disabled={busy}>
                Save
              </Button>
            </div>
          </>
        )}
    </div>
  )
}
