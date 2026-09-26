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
      {isEdit ? (
        <Can action={Action.UPDATE} resource="client">
          <Button type="submit" variant="primary" isLoading={saving}>
            Save changes
          </Button>
        </Can>
      ) : (
        <Can action={Action.CREATE} resource="client" minScope="SELF">
          <Button type="submit" variant="primary" isLoading={saving}>
            Create client
          </Button>
        </Can>
      )}
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
