import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { myAdminRoutes } from '@/modules/admin/routes'
import { useRoleForm } from '../hooks/use-role-form'
import { hierarchyLevels, inheritOptions, permissionActionLabels } from '../schemas/enums'
import type { RoleFormProps, RolePermissionAction } from '../types'

export function RoleFormPage({ mode, roleId, duplicateFromId }: RoleFormProps) {
  const form = useRoleForm(mode, roleId, duplicateFromId)

  if (form.isLoadingRole || form.isLoadingCatalog) {
    return <div className="p-12 text-center text-on-surface-variant">Loading...</div>
  }

  const isDuplicate = mode === 'create' && form.isDuplicate
  const title =
    mode === 'create'
      ? isDuplicate
        ? `Duplicate Role: ${form.sourceRole?.name ?? ''}`
        : 'Add New Role'
      : `Edit Role: ${form.role?.name ?? ''}`
  const description =
    mode === 'create'
      ? isDuplicate
        ? 'Create a new role starting from the source permissions. Adjust what you need, then save.'
        : 'Define access levels and assign granular permissions for a new organizational role.'
      : 'Update functional access levels and module permissions.'

  const { modules, actions, matrix, serverError } = form

  const grantedCount = modules.reduce(
    (sum, mod) => sum + actions.filter((a) => matrix[mod]?.[a]).length,
    0,
  )
  const totalCells = modules.length * actions.length

  return (
    <div className="space-y-6 pb-28">
      <BackButton
        to={
          mode === 'create'
            ? myAdminRoutes.rolesList
            : roleId
              ? myAdminRoutes.rolesDetail(roleId)
              : myAdminRoutes.rolesList
        }
        label={mode === 'create' ? 'Back to Roles & Permissions' : 'Back to Role Detail'}
      />

      <PageHeader title={title} description={description} />

      {serverError && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-outline-variant">
              <span className="material-symbols-outlined text-secondary">badge</span>
              <h3 className="text-title-lg font-semibold text-primary">Role Identity</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Role Name</label>
                <input
                  value={form.name}
                  onChange={(e) => form.setName(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-transparent transition-all"
                  placeholder="e.g., Senior Financial Analyst"
                />
              </div>
              {mode === 'create' && (
                <>
                  <div>
                    <label className="block text-label-md text-on-surface-variant mb-2">Hierarchy Level</label>
                    <select
                      value={form.hierarchy}
                      onChange={(e) => form.setHierarchy(e.target.value)}
                      className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-sm outline-none focus:border-secondary bg-transparent"
                    >
                      {['Select Level', ...hierarchyLevels].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-md text-on-surface-variant mb-2">
                      Inherit permissions from
                    </label>
                    <select
                      value={form.inherit}
                      onChange={(e) => form.setInherit(e.target.value)}
                      className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-sm outline-none focus:border-secondary bg-transparent"
                    >
                      {inheritOptions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => form.setDescription(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-sm min-h-[100px] outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 bg-transparent"
                  placeholder="Briefly describe the responsibilities..."
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <div>
                  <p className="text-label-md text-primary font-medium">Role Status</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {mode === 'edit' && form.role
                      ? `${form.role.usersCount} users assigned`
                      : 'Active roles are immediately available.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.active}
                  onClick={() => form.setActive(!form.active)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    form.active ? 'bg-secondary' : 'bg-outline-variant',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                      form.active ? 'left-[22px]' : 'left-0.5',
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
          {mode === 'create' && (
            <div className="bg-surface-container-low p-6 rounded-xl border border-secondary/20">
              <h4 className="text-label-md text-secondary flex items-center gap-2 mb-2 font-medium">
                <span className="material-symbols-outlined text-[18px]">info</span>
                {isDuplicate ? 'Duplicating' : 'Best Practice'}
              </h4>
              <p className="text-body-sm text-on-surface-variant">
                {isDuplicate
                  ? 'Permission ticks are copied from the source role. Saving creates a new role; the original is unchanged.'
                  : 'Assign the lowest necessary permissions. Modules and actions are loaded from the RBAC seed catalogue (resources + Action enum).'}
              </p>
            </div>
          )}
        </section>

        <section className="lg:col-span-8 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">grid_view</span>
                <h3 className="text-title-lg font-semibold text-primary">
                  {mode === 'create' ? 'Permission Matrix' : 'Module Permissions Matrix'}
                </h3>
              </div>
              {mode === 'create' && (
                <div className="flex gap-4">
                  <button type="button" className="text-label-sm text-secondary hover:underline" onClick={form.expandAll}>
                    Expand All
                  </button>
                  <button type="button" className="text-label-sm text-secondary hover:underline" onClick={form.resetMatrix}>
                    Reset Matrix
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 border-b border-outline-variant text-label-md text-primary w-1/4">
                      Module
                    </th>
                    {actions.map((a) => (
                      <th
                        key={a}
                        className="px-3 py-4 border-b border-outline-variant text-label-sm text-on-surface-variant text-center"
                      >
                        {permissionActionLabels[a] ?? a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {mode === 'create' && (
                    <tr className="bg-surface-container-lowest font-bold">
                      <td className="px-6 py-3 text-label-md text-primary italic">Select All Columns</td>
                      {actions.map((a) => (
                        <td key={a} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                            checked={modules.length > 0 && modules.every((m) => matrix[m]?.[a])}
                            onChange={() => form.toggleColAll(a as RolePermissionAction)}
                          />
                        </td>
                      ))}
                    </tr>
                  )}
                  {modules.map((mod) => (
                    <tr key={mod} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-label-md text-primary font-medium">{mod}</span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-outline-variant text-secondary focus:ring-secondary h-3 w-3"
                              checked={actions.length > 0 && actions.every((a) => matrix[mod]?.[a])}
                              onChange={() => form.toggleRowAll(mod)}
                            />
                            <span className="text-[10px] text-on-surface-variant font-medium">All</span>
                          </label>
                        </div>
                      </td>
                      {actions.map((a) => (
                        <td key={a} className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                            checked={Boolean(matrix[mod]?.[a])}
                            onChange={() => form.toggleCell(mod, a as RolePermissionAction)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined">checklist</span>
              </div>
              <div>
                <p className="text-label-md font-semibold text-on-surface">Permission summary</p>
                <p className="text-body-sm text-on-surface-variant">
                  {grantedCount} of {totalCells} grants selected across {modules.length} modules
                </p>
              </div>
            </div>
            <div className="text-label-sm text-on-surface-variant">
              Status:{' '}
              <span className={cn('font-semibold', form.active ? 'text-secondary' : 'text-on-surface-variant')}>
                {form.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm executive-shadow">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-body-sm text-on-surface-variant">
            {mode === 'create'
              ? isDuplicate
                ? 'Saving creates a new role with the selected permissions.'
                : 'Review the matrix carefully before creating this role.'
              : 'Changes apply to all users currently assigned this role.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={form.cancel} disabled={form.isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={form.isSubmitting} onClick={form.submit}>
              {mode === 'create' ? 'Create Role' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
