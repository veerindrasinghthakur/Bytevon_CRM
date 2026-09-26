import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import { ArchivedBadge } from '@/shared/components/ui/ArchivedBadge'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { myAdminRoutes } from '@/modules/admin/routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { useUserDetail } from '../../hooks/user/use-user-detail'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/shared/components/ui/Modal'
import { Section, Field, EditableField } from '@/shared/components/ui/Section'

export function UserDetailPage() {
  const { userId } = useParams({ strict: false }) as { userId?: string }
  const navigate = useNavigate()
  const d = useUserDetail(userId)

  useDeletedRedirect({ ready: !d.isLoading, data: d.display, error: d.detailError, listTo: myAdminRoutes.usersList })

  if (d.isLoading) return <PageLoadingSkeleton />
  if (d.isError || !d.display) {
    return (
      <ErrorState
        title="Could not load user"
        description={d.loadError ?? undefined}
        onRetry={d.refetch}
      />
    )
  }

  const display = d.display
  const isLocked = d.status === 'Locked'
  const isInactive = d.status === 'Inactive'
  const name = d.form.watch('name')
  const email = d.form.watch('email')
  const serverError = d.serverError ?? d.actionError ?? null

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={myAdminRoutes.usersList} label="Back to Users" />

      {serverError && (
        <div
          className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error"
          role="alert"
        >
          <span className="material-symbols-outlined shrink-0 text-[20px]">error</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-background">Action failed</p>
            <p className="text-error break-words">{serverError}</p>
          </div>
        </div>
      )}

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
          <Can action={Action.UNLOCK} resource={'user'}>
            <Button variant="primary" size="sm" onClick={() => d.setLockOpen(true)}>
              Unlock
            </Button>
          </Can>
        </div>
      )}

      {isInactive && !isLocked && (
        <div
          className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container px-4 py-3 text-body-sm"
          role="status"
        >
          <span className="material-symbols-outlined text-on-surface-variant shrink-0">person_off</span>
          <div className="flex-1">
            <p className="font-semibold text-on-background">Account deactivated</p>
            <p className="text-on-surface-variant">
              Login is disabled. Activate to restore sign-in, or delete to remove credentials.
            </p>
          </div>
          <Can action={Action.UPDATE} resource={'user'}>
            <Button
              variant="primary"
              size="sm"
              isLoading={d.activateMutation.isPending}
              onClick={() => d.activateMutation.mutate()}
            >
              Activate
            </Button>
          </Can>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {d.avatarUrl ? (
              <img
                src={d.avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-secondary/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-title-lg font-bold border-2 border-secondary/30">
                {display.initials}
              </div>
            )}
            <button
              type="button"
              className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary p-1.5 rounded-full shadow hover:scale-105 transition-transform disabled:opacity-50"
              aria-label="Change photo"
              title="Change photo"
              disabled={d.avatarUploading}
              onClick={() => d.fileRef.current?.click()}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <input
              ref={d.fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void d.onAvatarPick(e)}
            />
          </div>
          <div>
            <PageHeader title={name} description={email} />
            {d.isArchived && (
              <div className="mt-1.5">
                <ArchivedBadge />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => d.setResetOpen(true)}>
            Reset Password
          </Button>
          {isLocked ? (
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10"
              onClick={() => d.setLockOpen(true)}
            >
              Unlock Account
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-error text-error hover:bg-error/10"
              onClick={() => d.setLockOpen(true)}
            >
              Lock Account
            </Button>
          )}

          {isInactive ? (
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10"
              isLoading={d.activateMutation.isPending}
              onClick={() => d.activateMutation.mutate()}
            >
              Activate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              isLoading={d.deactivateMutation.isPending}
              onClick={() => d.deactivateMutation.mutate()}
            >
              Deactivate
            </Button>
          )}

          {!d.isArchived && (
            <DeleteButton
              iconOnly
              entityLabel={name}
              isLoading={d.deleteMutation.isPending}
              onConfirm={() => d.deleteMutation.mutateAsync()}
            />
          )}

          {d.isArchived && (
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10"
              leftIcon={
                <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
              }
              isLoading={d.restoreMutation.isPending}
              onClick={() => d.restoreMutation.mutate()}
            >
              Restore
            </Button>
          )}

          {d.isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={d.handleCancelEdit}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={d.saveMutation.isPending}
                onClick={() =>
                  d.form.handleSubmit((values) => {
                    d.saveMutation.mutate(values)
                  })()
                }
              >
                Save
              </Button>
            </>
          ) : (
            <EditButton iconOnly onClick={d.startEditing} title="Edit user" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Profile">
            <Field label="User ID" value={String(display.id)} />
            <EditableField
              label="Full Name"
              value={name}
              editing={d.isEditing}
              registration={d.form.register('name')}
              error={d.form.formState.errors.name?.message}
            />
            <EditableField
              label="Email"
              value={email}
              editing={d.isEditing}
              registration={d.form.register('email')}
              error={d.form.formState.errors.email?.message}
            />
            {d.isEditing ? (
              <div className="mb-3">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Department
                </p>
                <SearchableSelect
                  options={d.deptOptions}
                  value={d.form.watch('departmentId')}
                  onChange={(v) => d.form.setValue('departmentId', v, { shouldValidate: true })}
                  placeholder="Search departments…"
                  emptyLabel="No departments match"
                />
              </div>
            ) : (
              <Field label="Department" value={display.department} />
            )}
            <Field label="Last Login" value={display.lastLogin} />
            <Field label="Employee code" value={display.employeeCode} />
          </Section>
          <Section title="Role Assignment">
            {d.isEditing ? (
              <div className="mb-3">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Primary Role
                </p>
                <SearchableSelect
                  options={d.roleOptions}
                  value={d.form.watch('roleId')}
                  onChange={(v) => d.form.setValue('roleId', v, { shouldValidate: true })}
                  placeholder="Search roles…"
                  emptyLabel="No roles match"
                />
              </div>
            ) : (
              <Field label="Primary Role" value={display.role} />
            )}
            <p className="text-body-sm text-on-surface-variant mt-2">
              Search and pick a role from the catalogue. Additional scoped roles can be assigned from Roles
              & Permissions.
            </p>
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Status">
            <span
              className={cn(
                'status-badge',
                d.status === 'Active' && 'status-success',
                d.status === 'Locked' && 'status-error',
                d.status === 'Inactive' && 'status-neutral',
              )}
            >
              {d.status}
            </span>
            <p className="text-body-sm text-on-surface-variant mt-3">
              <strong>Deactivate</strong> keeps credentials but blocks sign-in (reversible).
              <br />
              <strong>Delete</strong> removes login credentials (soft-delete); the employment appears under users
              without credentials.
            </p>
          </Section>
          <Section title="Quick Actions">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => safeNavigate(navigate, { to: myAdminRoutes.audit })}
              >
                Audit for user
              </Button>
            </div>
          </Section>
        </div>
      </div>

      {d.resetOpen && (
        <Modal onClose={() => d.setResetOpen(false)} title="Reset password">
          {d.resetSent ? (
            <p className="text-body-md text-secondary font-medium">Temporary password set for {email}.</p>
          ) : (
            <>
              <p className="text-body-sm text-on-surface-variant mb-3">
                Sets a temporary password on the login (V1). Optional custom value below; otherwise one is
                generated.
              </p>
              <input
                type="text"
                value={d.tempPassword}
                onChange={(e) => d.setTempPassword(e.target.value)}
                placeholder="Optional temporary password (min 8 chars)"
                className="w-full mb-4 rounded-lg border border-outline-variant px-3 py-2 text-body-sm outline-none focus:border-secondary"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => d.setResetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={d.resetMutation.isPending}
                  onClick={() => d.resetMutation.mutate()}
                >
                  Set temporary password
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}

      {d.lockOpen && (
        <Modal
          onClose={() => d.setLockOpen(false)}
          title={isLocked ? 'Unlock account?' : 'Lock account?'}
          danger={!isLocked}
        >
          <p className="text-body-sm text-on-surface-variant mb-4">
            {isLocked
              ? `${name} will be able to sign in again after unlock.`
              : `Locking ${name} immediately ends active sessions and blocks new logins until unlocked.`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => d.setLockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isLocked ? 'primary' : 'outline'}
              size="sm"
              className={!isLocked ? 'border-error text-error' : undefined}
              disabled={d.lockMutation.isPending}
              onClick={() => d.lockMutation.mutate()}
            >
              {isLocked ? 'Unlock' : 'Lock account'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
