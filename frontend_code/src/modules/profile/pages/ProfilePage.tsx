import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { useAuth } from '@/modules/auth'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account and security preferences" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm card-hover">
          <h3 className="text-title-md font-semibold mb-4">Account</h3>
          <dl className="space-y-3 text-body-sm">
            <div>
              <dt className="text-label-sm text-on-surface-variant">Name</dt>
              <dd className="font-medium">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-label-sm text-on-surface-variant">Email</dt>
              <dd className="font-medium">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-label-sm text-on-surface-variant">Role</dt>
              <dd className="font-medium">{user?.role ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-label-sm text-on-surface-variant">Employment ID</dt>
              <dd className="font-medium">{user?.employmentId ?? '—'}</dd>
            </div>
          </dl>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm card-hover">
          <h3 className="text-title-md font-semibold mb-4">Security</h3>
          <Link
            to="/profile/sessions"
            className="flex items-center justify-between rounded-lg border border-outline-variant p-4 hover:border-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">devices</span>
              <div>
                <p className="font-medium">Active sessions</p>
                <p className="text-body-sm text-on-surface-variant">Revoke devices and refresh tokens</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
