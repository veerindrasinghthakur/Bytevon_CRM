import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Can } from '@/shared/rbac/Can.tsx'
import { Action, ResourceName } from '@/shared/schema'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { uploadUserAvatar } from '@/modules/profile/api/profile'
import {
  getUserLogin,
  lockUser,
  unlockUser,
  updateUserLogin,
} from '../api/users'
import { cn } from '@/shared/lib/cn'

export function UserDetailPage() {
  const { userId } = useParams({ strict: false }) as { userId?: string }
  const loginId = userId ? Number(userId) : NaN
  const navigate = useNavigate()
  const qc = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['admin', 'users', 'detail', loginId],
    queryFn: () => getUserLogin(loginId),
    enabled: Number.isFinite(loginId),
  })

  const display = detailQuery.data?.display
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)

  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Locked'>('Active')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [resetOpen, setResetOpen] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  useEffect(() => {
    if (!display) return
    setStatus(display.status)
    setName(display.name)
    setEmail(display.email)
    setDepartment(display.department)
    setRole(display.role)
  }, [display])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateUserLogin(loginId, {
        email,
        name,
        department,
        role,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      finishEditing()
    },
  })

  const lockMutation = useMutation({
    mutationFn: async () => {
      if (status === 'Locked') return unlockUser(loginId)
      return lockUser(loginId)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      setStatus((s) => (s === 'Locked' ? 'Active' : 'Locked'))
      setLockOpen(false)
    },
  })

  const resetMutation = useMutation({
    mutationFn: () =>
      updateUserLogin(loginId, {
        temporaryPassword: tempPassword || `Temp@${Date.now().toString().slice(-6)}`,
      }),
    onSuccess: () => {
      setResetSent(true)
      setTimeout(() => {
        setResetOpen(false)
        setResetSent(false)
        setTempPassword('')
      }, 1500)
    },
  })

  const handleCancelEdit = () => {
    if (display) {
      setName(display.name)
      setEmail(display.email)
      setDepartment(display.department)
      setRole(display.role)
    }
    cancelEditing()
  }

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    try {
      const res = await uploadUserAvatar(userId, file)
      setAvatarUrl(res.avatarUrl)
    } catch {
      /* optional */
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  if (detailQuery.isLoading) return <PageLoadingSkeleton />
  if (detailQuery.isError || !display) {
    return (
      <ErrorState
        title="Could not load user"
        onRetry={() => void detailQuery.refetch()}
      />
    )
  }

  const isLocked = status === 'Locked'
  const initials = display.initials

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/admin/users" label="Back to Users" />

      {isLocked && (
        <div
          className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm"
          role="status"
        >
          <span className="material-symbols-outlined text-error shrink-0">lock</span>
          <div className="flex-1">
            <p className="font-semibold text-on-background">Account locked</p>
            <p className="text-on-surface-variant">This user cannot sign in until the account is unlocked.</p>
          </div>
          <Can action={Action.UNLOCK} resource={ResourceName.USER}>
            <Button variant="primary" size="sm" onClick={() => setLockOpen(true)}>
              Unlock
            </Button>
          </Can>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-secondary/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-title-lg font-bold border-2 border-secondary/30">
                {initials}
              </div>
            )}
            <button
              type="button"
              className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary p-1.5 rounded-full shadow hover:scale-105 transition-transform disabled:opacity-50"
              aria-label="Change photo"
              title="Change photo"
              disabled={avatarUploading}
              onClick={() => fileRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onAvatarPick(e)}
            />
          </div>
          <PageHeader title={name} description={email} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
            Reset Password
          </Button>
          {isLocked ? (
            <Can action={Action.UNLOCK} resource={ResourceName.USER}>
              <Button
                variant="outline"
                size="sm"
                className="border-secondary text-secondary hover:bg-secondary/10"
                onClick={() => setLockOpen(true)}
              >
                Unlock Account
              </Button>
            </Can>
          ) : (
            <Can action={Action.UPDATE} resource={ResourceName.USER}>
              <Button
                variant="outline"
                size="sm"
                className="border-error text-error hover:bg-error/10"
                onClick={() => setLockOpen(true)}
              >
                Lock Account
              </Button>
            </Can>
          )}
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                Save
              </Button>
            </>
          ) : (
            <EditButton iconOnly onClick={startEditing} title="Edit user" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Profile">
            <Field label="User ID" value={String(display.id)} />
            <EditableField label="Full Name" value={name} editing={isEditing} onChange={setName} />
            <EditableField label="Email" value={email} editing={isEditing} onChange={setEmail} />
            <EditableField
              label="Department"
              value={department}
              editing={isEditing}
              onChange={setDepartment}
            />
            <Field label="Last Login" value={display.lastLogin} />
            <Field label="Employee code" value={display.employeeCode} />
          </Card>
          <Card title="Role Assignment">
            <EditableField label="Primary Role" value={role} editing={isEditing} onChange={setRole} />
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
            <p className="text-body-md text-secondary font-medium">Temporary password set for {email}.</p>
          ) : (
            <>
              <p className="text-body-sm text-on-surface-variant mb-3">
                Sets a temporary password on the login (V1). Optional custom value below; otherwise one is generated.
              </p>
              <input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Optional temporary password (min 8 chars)"
                className="w-full mb-4 rounded-lg border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-secondary"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setResetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={resetMutation.isPending}
                  onClick={() => resetMutation.mutate()}
                >
                  Set temporary password
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
              disabled={lockMutation.isPending}
              onClick={() => lockMutation.mutate()}
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
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-surface-container transition-colors"
              onClick={onClose}
            >
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
