import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminRoles } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function RolesListPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Define RBAC roles and the permissions they grant."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/admin/roles/new' })}
          >
            Add Role
          </Button>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminRoles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => navigate({ to: '/admin/roles/$roleId', params: { roleId: role.id } })}
            className={cn(
              'text-left p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm',
              'hover:border-secondary/40'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-title-lg font-semibold text-on-background">{role.name}</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">{role.description}</p>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-label-sm font-medium border',
                  role.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant'
                )}
              >
                {role.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
              <span>{role.usersCount.toLocaleString()} users</span>
              <span>{role.permissions.length} permissions</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {role.permissions.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded bg-surface-container-low text-label-sm text-on-surface-variant"
                >
                  {p}
                </span>
              ))}
              {role.permissions.length > 3 && (
                <span className="text-label-sm text-on-surface-variant">+{role.permissions.length - 3}</span>
              )}
            </div>
          </button>
        ))}
      </section>
    </div>
  )
}
