import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminRoles } from '../data/mock'

export function RoleDetailPage() {
  const { roleId } = useParams({ strict: false }) as { roleId?: string }
  const navigate = useNavigate()
  const role = adminRoles.find((r) => r.id === roleId) ?? adminRoles[0]

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/roles' })}
        className="flex items-center gap-2 text-secondary text-label-md hover:text-primary"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Roles
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader title={role.name} description={role.description} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/roles/new' })}>
            Duplicate
          </Button>
          <Button variant="primary" size="sm">
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
          <h3 className="text-title-lg font-semibold text-on-background mb-4">Permissions</h3>
          <ul className="space-y-2">
            {role.permissions.map((p) => (
              <li
                key={p}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant"
              >
                <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                <span className="text-body-md font-mono text-on-background">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
            <h3 className="text-title-lg font-semibold text-on-background mb-2">Summary</h3>
            <p className="text-body-sm text-on-surface-variant mb-1">Users assigned</p>
            <p className="text-headline-md font-bold text-on-background">{role.usersCount}</p>
            <p className="text-body-sm text-on-surface-variant mt-3 mb-1">Status</p>
            <p className="text-body-md font-medium">{role.status}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
