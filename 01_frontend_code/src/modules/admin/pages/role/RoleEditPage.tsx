import { useParams } from '@tanstack/react-router'
import { RoleFormPage } from '../../components/role/RoleFormPage'

export function RoleEditPage() {
  const { roleId } = useParams({ strict: false }) as { roleId?: string }
  return <RoleFormPage mode="edit" roleId={roleId} />
}
