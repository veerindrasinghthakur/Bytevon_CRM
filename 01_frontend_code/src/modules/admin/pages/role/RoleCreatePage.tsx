import { useSearch } from '@tanstack/react-router'
import { RoleFormPage } from '../../components/role/RoleFormPage'

export function RoleCreatePage() {
  // optional ?duplicateFrom=<roleId>
  const search = useSearch({ strict: false }) as { duplicateFrom?: string }
  const duplicateFromId = search?.duplicateFrom
  return <RoleFormPage mode="create" duplicateFromId={duplicateFromId} />
}
