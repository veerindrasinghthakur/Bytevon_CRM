import { Button } from '@/shared/components/ui/Button'
import { ArchiveButton } from '@/shared/components/ui/ArchiveButton'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

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
        <Can action={Action.UPDATE} resource="lead">
          <ArchiveButton entityLabel={entityLabel} onConfirm={onArchive} isLoading={archiveLoading} />
        </Can>
      )}
      <Can action={isEdit ? Action.UPDATE : Action.CREATE} resource="lead">
        <Button type="submit" variant="primary" isLoading={saving}>
          {isEdit ? 'Save changes' : 'Create lead'}
        </Button>
      </Can>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
