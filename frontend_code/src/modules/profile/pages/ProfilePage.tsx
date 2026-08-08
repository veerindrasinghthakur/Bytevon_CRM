import { PageHeader } from '@/shared/components/layout/PageHeader'

export function ProfilePage() {
  return (
    <div>
      <PageHeader
        title="Profile"
        description="Account settings and preferences."
        showBack
        backTo="/dashboard"
        backLabel="Back"
      />

      <div className="max-w-2xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-3xl">person</span>
          </div>
          <div>
            <p className="text-title-lg text-on-background font-semibold">Marcus S.</p>
            <p className="text-body-md text-on-surface-variant">Admin Access</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">marcus@bytevon.example</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-outline-variant pt-6">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Role</p>
            <p className="text-body-md text-on-surface">Administrator</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Department</p>
            <p className="text-body-md text-on-surface">Operations</p>
          </div>
        </div>

        <p className="text-body-sm text-on-surface-variant">
          Full profile edit, password, and notification preferences will connect to Auth / Profile API later.
        </p>
      </div>
    </div>
  )
}
