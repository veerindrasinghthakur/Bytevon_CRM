import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { useAuth } from '@/modules/auth'

export function ProfilePage() {
  const { user } = useAuth()
  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U'

  return (
    <div className="space-y-8">
      <PageHeader title="My Profile" description="Account details and security preferences" />

      <div className="flex flex-col sm:flex-row items-start gap-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm card-hover">
        <div className="w-20 h-20 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-headline-md font-bold border-2 border-secondary/30 shrink-0">
          {initials}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Name</p>
            <p className="text-body-md font-semibold text-on-background">{user?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Email</p>
            <p className="text-body-md font-semibold text-on-background">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Role</p>
            <p className="text-body-md font-semibold text-on-background">{user?.role ?? '—'}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Employment ID</p>
            <p className="text-body-md font-semibold text-on-background">{user?.employmentId ?? '—'}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-title-md font-semibold text-on-background mb-3">Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/profile/sessions"
            className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm card-hover"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">devices</span>
              <div>
                <p className="font-semibold text-on-background">Active sessions</p>
                <p className="text-body-sm text-on-surface-variant">
                  Review and revoke signed-in devices
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </Link>
          <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm opacity-80">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">password</span>
              <div>
                <p className="font-semibold text-on-background">Change password</p>
                <p className="text-body-sm text-on-surface-variant">Update your sign-in password</p>
              </div>
            </div>
            <span className="text-label-sm text-on-surface-variant">Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
