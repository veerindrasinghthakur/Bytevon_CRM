import { useNavigate } from '@tanstack/react-router'
import { myAdminRoutes } from '@/modules/admin/routes'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { useUserCreate } from '../../hooks/user/use-user-create'

export function UserCreatePage() {
  const {
    loading,
    form,
    candidates,
    roles,
    deptOptions,
    employeeOptions,
    selected,
    onSelectEmployee,
    submit,
    isSubmitting,
  } = useUserCreate()
  const navigate = useNavigate()
  const goUsers = () => safeNavigate(navigate, { to: myAdminRoutes.usersList })
  const goNewEmployee = () => safeNavigate(navigate, { to: '/workforce/employees/new' })

  const values = form.watch()
  const sendInvite = values.sendInvite ?? true

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={goUsers}
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        <span className="text-label-md font-medium">Back to Users</span>
      </button>

      <PageHeader
        title="Add New User"
        description="Pick an existing employee without login. Department is shown from their assignment (filterable)."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goUsers}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
              onClick={submit}
            >
              {sendInvite ? 'Create & Invite' : 'Create User'}
            </Button>
          </div>
        }
      />

      {form.formState.errors.root?.message && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {form.formState.errors.root.message}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-on-surface-variant">Loading…</div>
      ) : candidates.length === 0 ? (
        <div className="bv-surface p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_check</span>
          <h3 className="text-title-lg font-semibold">All employees have logins</h3>
          <Button variant="primary" size="sm" onClick={goNewEmployee}>
            Add Employee
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bv-surface p-6 space-y-5">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">badge</span>
                Select Employee
              </h3>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Filter by department
                </label>
                <SearchableSelect
                  options={deptOptions}
                  value={values.deptFilter ?? ''}
                  onChange={(v) => {
                    form.setValue('deptFilter', v, { shouldValidate: true })
                    onSelectEmployee('')
                  }}
                  placeholder="Type department name…"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Employee
                </label>
                <SearchableSelect
                  options={employeeOptions}
                  value={values.employmentId}
                  onChange={onSelectEmployee}
                  placeholder="Type name or code…"
                />
                {form.formState.errors.employmentId && (
                  <p className="text-caption text-error mt-1">{form.formState.errors.employmentId.message}</p>
                )}
              </div>

              {selected && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <ReadOnly label="Code" value={selected.employeeCode} />
                  <ReadOnly label="Department" value={selected.department} />
                  <ReadOnly label="Position" value={selected.position} />
                  <ReadOnly label="Joined" value={selected.joiningDate} />
                </div>
              )}
            </div>

            <div className="bv-surface p-6 space-y-5">
              <h3 className="text-title-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">key</span>
                Login Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    {...form.register('email')}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-transparent transition-colors"
                  />
                  {form.formState.errors.email && (
                    <p className="text-caption text-error mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    placeholder="Min. 8 characters"
                    {...form.register('temporaryPassword')}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-transparent transition-colors"
                  />
                  {form.formState.errors.temporaryPassword && (
                    <p className="text-caption text-error mt-1">
                      {form.formState.errors.temporaryPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bv-surface p-6 space-y-5">
              <h3 className="text-title-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">admin_panel_settings</span>
                Access
              </h3>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Primary Role
                </label>
                <SearchableSelect
                  options={roles.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                    meta: r.description ?? undefined,
                  }))}
                  value={values.roleId}
                  onChange={(v) => form.setValue('roleId', v, { shouldValidate: true })}
                  placeholder="Type role name…"
                />
                {form.formState.errors.roleId && (
                  <p className="text-caption text-error mt-1">{form.formState.errors.roleId.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bv-surface p-6 space-y-4">
              <h3 className="text-title-lg font-semibold">Invite Options</h3>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => form.setValue('sendInvite', e.target.checked)}
                  className="mt-1 rounded border-outline-variant text-secondary"
                />
                <div>
                  <p className="text-body-md font-medium">Send invite email</p>
                  <p className="text-body-sm text-on-surface-variant">Mock notification only.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase">{label}</p>
      <p className={cn('text-body-sm font-medium text-on-background truncate')}>{value}</p>
    </div>
  )
}
