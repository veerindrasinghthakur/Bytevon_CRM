import { Button } from '@/shared/components/ui/Button'

type Props = {
  isEdit: boolean
  saving: boolean
  onCancel: () => void
}

/** Submit / cancel for client create-edit form. */
export function ClientFormActions({ isEdit, saving, onCancel }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" variant="primary" isLoading={saving}>
        {isEdit ? 'Save changes' : 'Create client'}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
