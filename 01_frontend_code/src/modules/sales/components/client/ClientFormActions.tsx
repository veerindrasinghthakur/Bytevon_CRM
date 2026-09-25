import { Button } from '@/shared/components/ui/Button'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

type Props = {
  isEdit: boolean
  saving: boolean
  onCancel: () => void
}

/** Submit / cancel for client create-edit form. */
export function ClientFormActions({ isEdit, saving, onCancel }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Can action={isEdit ? Action.UPDATE : Action.CREATE} resource="client">
        <Button type="submit" variant="primary" isLoading={saving}>
          {isEdit ? 'Save changes' : 'Create client'}
        </Button>
      </Can>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
