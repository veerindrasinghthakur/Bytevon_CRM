import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { cn } from '@/shared/lib/cn'
import { useUserCreate } from '../hooks/use-user-create'

export function UserCreatePage() {
  const form = useUserCreate()

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => form.navigate({ to: '/admin/users' })}
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
            <Button variant="outline" size="sm" onClick={() => form.navigate({ to: '/admin/users' })}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={form.saving}
              leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
              onClick={form.handleCreate}
            >
              {form.sendInvite ? 'Create & Invite' : 'Create User'}
            </Button>
          </div>
        }
      />

      {form.error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {form.error}
        </div>
      )}

      {form.loading ? (
        <div className="p-12 text-center text-on-surface-variant">Loading…</div>
      ) : form.candidates.length === 0 ? (
        <div className="bv-surface p-10 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_check</span>
          <h3 className="text-title-lg font-semibold">All employees have logins</h3>
          <Button variant="primary" size="sm" onClick={() => form.navigate({ to: '/workforce/employees/new' })}>
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
                  options={form.deptOptions}
                  value={form.deptFilter}
                  onChange={(v) => {
                    form.setDeptFilter(v)
                    form.onSelectEmployee('')
                  }}
                  placeholder="Type department name…"
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Employee
                </label>
                <SearchableSelect
                  options={form.employeeOptions}
                  value={form.employmentId}
                  onChange={form.onSelectEmployee}
                  placeholder="Type name or code…"
                />
              </div>

              {form.selected && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <ReadOnly label="Code" value={form.selected.employeeCode} />
                  <ReadOnly label="Department" value={form.selected.department} />
                  <ReadOnly label="Position" value={form.selected.position} />
                  <ReadOnly label="Joined" value={form.selected.joiningDate} />
                </div>
              )}
            </div>

            <div className="bv-surface p-6 space-y-5">
              <h3 className="text-title-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">key</span>
                Login Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Work Email" value={form.email} onChange={form.setEmail} type="email" />
                <Field
                  label="Temporary Password"
                  value={form.tempPassword}
                  onChange={form.setTempPassword}
                  placeholder="Min. 8 characters"
                />
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
                  options={form.roles.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                    meta: r.description ?? undefined,
                  }))}
                  value={form.roleId}
                  onChange={form.setRoleId}
                  placeholder="Type role name…"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bv-surface p-6 space-y-4">
              <h3 className="text-title-lg font-semibold">Invite Options</h3>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendInvite}
                  onChange={(e) => form.setSendInvite(e.target.checked)}
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-label-sm font-bold text-on-surface-variant uppercase mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 bg-transparent transition-colors"
      />
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
