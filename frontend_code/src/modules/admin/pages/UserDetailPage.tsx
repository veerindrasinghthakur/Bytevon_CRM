import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminUsers } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function UserDetailPage() {
  const { userId } = useParams({ strict: false }) as { userId?: string }
  const navigate = useNavigate()
  const user = adminUsers.find((u) => u.id === userId) ?? adminUsers[0]

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/users' })}
        className="flex items-center gap-2 text-secondary text-label-md hover:text-primary"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Users
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-title-lg font-bold border-2 border-secondary/30">
            {user.initials}
          </div>
          <PageHeader title={user.name} description={user.email} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Reset Password
          </Button>
          <Button variant="outline" size="sm" className="border-error text-error">
            {user.status === 'Locked' ? 'Unlock' : 'Lock Account'}
          </Button>
          <Button variant="primary" size="sm">
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Profile">
            <Field label="User ID" value={user.id} />
            <Field label="Full Name" value={user.name} />
            <Field label="Email" value={user.email} />
            <Field label="Department" value={user.department} />
            <Field label="Last Login" value={user.lastLogin} />
          </Card>
          <Card title="Role Assignment">
            <Field label="Primary Role" value={user.role} />
            <p className="text-body-sm text-on-surface-variant mt-2">
              Additional scoped roles can be assigned from Roles &amp; Permissions.
            </p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Status">
            <span
              className={cn(
                'inline-flex px-3 py-1 rounded-full text-label-sm font-medium border',
                user.status === 'Active' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                user.status === 'Locked' && 'bg-red-50 text-red-700 border-red-200',
                user.status === 'Inactive' && 'bg-surface-container text-on-surface-variant border-outline-variant'
              )}
            >
              {user.status}
            </span>
          </Card>
          <Card title="Quick Actions">
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                View sessions
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                Audit for user
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
      <h3 className="text-title-lg font-semibold text-on-background mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-body-md text-on-background">{value}</p>
    </div>
  )
}
