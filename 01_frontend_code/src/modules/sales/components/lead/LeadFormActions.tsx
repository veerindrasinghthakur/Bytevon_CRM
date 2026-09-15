import { Button } from '@/shared/components/ui/Button'
import { ArchiveButton } from '@/shared/components/ui/ArchiveButton'

type Props = {
  isEdit: boolean
  saving: boolean
  archiveLoading: boolean
  entityLabel: string
  onArchive: () => void
  onCancel: () => void
}

/** Submit / cancel / archive row for lead create-edit form. */
export function LeadFormActions({
  isEdit,
  saving,
  archiveLoading,
  entityLabel,
  onArchive,
  onCancel,
}: Props) {
  return (
    <div className="flex items-center gap-3 pt-2 flex-wrap">
      {isEdit && (
        <ArchiveButton entityLabel={entityLabel} onConfirm={onArchive} isLoading={archiveLoading} />
      )}
      <Button type="submit" variant="primary" isLoading={saving}>
        {isEdit ? 'Save changes' : 'Create lead'}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
