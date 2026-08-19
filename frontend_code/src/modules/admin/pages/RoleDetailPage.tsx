import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminRoles, adminUsers } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function RoleDetailPage() {
  const { roleId } = useParams({ strict: false }) as { roleId?: string }
  const navigate = useNavigate()
  const role = adminRoles.find((r) => r.id === roleId) ?? adminRoles[0]

  const assignees = adminUsers.filter(
    (u) => u.role.toLowerCase().includes(role.name.toLowerCase().split(' ')[0]) || role.name === 'Employee'
  )
  const assigned = assignees.length > 0 ? assignees : adminUsers.slice(0, Math.min(role.usersCount, 4))

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/roles' })}
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        <span className="text-label-md font-medium">Back to Roles & Permissions</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                role.category === 'Core Role'
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-surface-container text-on-surface-variant'
              )}
            >
              {role.category}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                role.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-surface-container text-on-surface-variant'
              )}
            >
              {role.status}
            </span>
          </div>
          <PageHeader title={role.name} description={role.description} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/admin/roles/new' })}
          >
            Duplicate
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
            onClick={() =>
              navigate({ to: '/admin/roles/$roleId/edit', params: { roleId: role.id } })
            }
          >
            Edit Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bv-surface p-6 space-y-4">
            <h3 className="text-title-lg font-semibold text-on-background">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Users assigned</p>
                <p className="text-2xl font-bold text-on-background">{role.usersCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Coverage</p>
                <p className="text-body-md font-semibold text-secondary">{role.coverageLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Created</p>
                <p className="text-body-sm text-on-surface">{role.created}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Updated</p>
                <p className="text-body-sm text-on-surface">{role.updated}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-label-sm mb-1">
                <span className="text-on-surface-variant">Access coverage</span>
                <span className="font-medium">{role.coveragePct}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: `${role.coveragePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bv-surface p-6">
          <h3 className="text-title-lg font-semibold text-on-background mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">key</span>
            Permissions
          </h3>
          {role.permissions.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No permissions listed for this role.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {role.permissions.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                  <span className="text-body-sm font-mono text-on-background">{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">group</span>
            Assigned Employees
          </h3>
          <span className="text-label-sm text-on-surface-variant">{assigned.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Employee</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Department</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Status</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {assigned.map((u) => (
                <tr
                  key={u.id}
                  className="zebra-row cursor-pointer"
                  onClick={() => navigate({ to: '/admin/users/$userId', params: { userId: u.id } })}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                        {u.initials}
                      </div>
                      <div>
                        <p className="font-medium text-on-background">{u.name}</p>
                        <p className="text-body-sm text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-on-surface-variant">{u.department}</td>
                  <td className="px-6 py-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        u.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : u.status === 'Locked'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-surface-container text-on-surface-variant'
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-on-surface-variant">{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
