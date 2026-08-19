import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminUsers } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function UserDetailPage() {
  const { userId } = useParams({ strict: false }) as { userId?: string }
  const navigate = useNavigate()
  const base = adminUsers.find((u) => u.id === userId) ?? adminUsers[0]

  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(base.status)
  const [name, setName] = useState(base.name)
  const [email, setEmail] = useState(base.email)
  const [department, setDepartment] = useState(base.department)
  const [role, setRole] = useState(base.role)

  const [resetOpen, setResetOpen] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const isLocked = status === 'Locked'

  const confirmLock = () => {
    setStatus(isLocked ? 'Active' : 'Locked')
    setLockOpen(false)
  }

  const sendReset = () => {
    setResetSent(true)
    setTimeout(() => {
      setResetOpen(false)
      setResetSent(false)
    }, 1500)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate({ to: '/admin/users' })}
        className="flex items-center gap-2 text-secondary text-label-md hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Users
      </button>

      {isLocked && (
        <div
          className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm"
          role="status"
        >
          <span className="material-symbols-outlined text-error shrink-0">lock</span>
          <div>
            <p className="font-semibold text-on-background">Account locked</p>
            <p className="text-on-surface-variant">
              This user cannot sign in until the account is unlocked.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-title-lg font-bold border-2 border-secondary/30">
            {base.initials}
          </div>
          <PageHeader title={name} description={email} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
            Reset Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-error text-error hover:bg-error/10"
            onClick={() => setLockOpen(true)}
          >
            {isLocked ? 'Unlock Account' : 'Lock Account'}
          </Button>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setEditing(false)}>
                Save
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-secondary hover:border-secondary transition-colors"
              aria-label="Edit user"
              title="Edit"
            >
              <span className="material-symbols-outlined text-[22px]">edit</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Profile">
            <Field label="User ID" value={base.id} />
            <EditableField label="Full Name" value={name} editing={editing} onChange={setName} />
            <EditableField label="Email" value={email} editing={editing} onChange={setEmail} />
            <EditableField
              label="Department"
              value={department}
              editing={editing}
              onChange={setDepartment}
            />
            <Field label="Last Login" value={base.lastLogin} />
          </Card>
          <Card title="Role Assignment">
            <EditableField label="Primary Role" value={role} editing={editing} onChange={setRole} />
            <p className="text-body-sm text-on-surface-variant mt-2">
              Additional scoped roles can be assigned from Roles & Permissions.
            </p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Status">
            <span
              className={cn(
                'inline-flex px-3 py-1 rounded-full text-label-sm font-medium border',
                status === 'Active' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                status === 'Locked' && 'bg-red-50 text-red-700 border-red-200',
                status === 'Inactive' &&
                  'bg-surface-container text-on-surface-variant border-outline-variant',
              )}
            >
              {status}
            </span>
          </Card>
          <Card title="Quick Actions">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => navigate({ to: '/admin/audit' })}
              >
                Audit for user
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {resetOpen && (
        <Modal onClose={() => setResetOpen(false)} title="Reset password">
          {resetSent ? (
            <p className="text-body-md text-secondary font-medium">Reset link sent to {email}.</p>
          ) : (
            <>
              <p className="text-body-sm text-on-surface-variant mb-4">
                A one-time password reset link will be emailed to <strong>{email}</strong>. The link
                expires in 10 minutes and can only be used once.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setResetOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={sendReset}>
                  Send reset link
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}

      {lockOpen && (
        <Modal
          onClose={() => setLockOpen(false)}
          title={isLocked ? 'Unlock account?' : 'Lock account?'}
          danger={!isLocked}
        >
          <p className="text-body-sm text-on-surface-variant mb-4">
            {isLocked
              ? `${name} will be able to sign in again after unlock.`
              : `Locking ${name} immediately ends active sessions and blocks new logins until unlocked.`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setLockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isLocked ? 'primary' : 'outline'}
              size="sm"
              className={!isLocked ? 'border-error text-error' : undefined}
              onClick={confirmLock}
            >
              {isLocked ? 'Unlock' : 'Lock account'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
  danger,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  danger?: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bv-surface executive-shadow w-full max-w-md">
          <div
            className={cn(
              'px-6 py-4 border-b border-outline-variant flex items-center justify-between',
              danger && 'bg-error/5',
            )}
          >
            <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
              {danger && <span className="material-symbols-outlined text-error">warning</span>}
              {title}
            </h3>
            <button type="button" className="p-1 rounded-lg hover:bg-surface-container transition-colors" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bv-surface p-6">
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

function EditableField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      {editing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
        />
      ) : (
        <p className="text-body-md text-on-background">{value}</p>
      )}
    </div>
  )
}
