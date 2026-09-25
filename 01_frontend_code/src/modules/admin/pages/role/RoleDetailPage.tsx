import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { myAdminRoutes } from '@/modules/admin/routes'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { getAdminRole, deleteAdminRole, restoreAdminRole, revokeRolePermission } from '../../api/roles'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import { ArchivedBadge } from '@/shared/components/ui/ArchivedBadge'
import { listAdminUsers } from '../../api/users'
import { cn } from '@/shared/lib/cn'
import { queryKeys } from '@/shared/lib/query-keys'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

export function RoleDetailPage() {
  const { roleId } = useParams({ strict: false }) as { roleId?: string }
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminRole(roleId as string),
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: queryKeys.admin.roles.all })
      void qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      safeNavigate(navigate, { to: myAdminRoutes.rolesList })
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not delete role'))
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreAdminRole(roleId as string),
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: queryKeys.admin.roles.all })
      void qc.invalidateQueries({ queryKey: queryKeys.admin.users.all })
      await roleQuery.refetch()
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not restore role'))
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (input: { permission_id: number; scope_id: number }) =>
      revokeRolePermission(roleId as string, input),
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: queryKeys.admin.roles.detail(roleId as string) })
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not revoke permission'))
    },
  })

  const roleQuery = useQuery({
    queryKey: queryKeys.admin.roles.detail(roleId as string),
    queryFn: () => getAdminRole(roleId as string),
    enabled: Boolean(roleId),
  })

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users.list(),
    queryFn: () => listAdminUsers(),
  })

  useDeletedRedirect({
    ready: !roleQuery.isLoading,
    data: roleQuery.data ?? null,
    error: roleQuery.error,
    listTo: myAdminRoutes.rolesList,
  })

  if (roleQuery.isLoading) return <PageLoadingSkeleton />
  if (roleQuery.isError || !roleQuery.data) {
    return (
      <ErrorState
        title="Could not load role"
        description={getApiErrorMessage(roleQuery.error, 'Role not found')}
        onRetry={() => void roleQuery.refetch()}
        onBack={() => safeNavigate(navigate, { to: myAdminRoutes.rolesList })}
      />
    )
  }

  const role = roleQuery.data

  const assigned =
    usersQuery.data?.items.filter((u) => {
      if (!role.name) return false
      const roleToken = role.name.toLowerCase().split(' ')[0]
      return (
        u.role.toLowerCase() === role.name.toLowerCase() ||
        u.role.toLowerCase().includes(roleToken)
      )
    }) ?? []

  const goDuplicate = () =>
    safeNavigate(navigate, { to: myAdminRoutes.rolesNew, search: { duplicateFrom: role.id } })

  const goEdit = () =>
    safeNavigate(navigate, { to: myAdminRoutes.rolesEdit(role.id), params: { roleId: role.id } })

  const goUser = (userId: number) =>
    safeNavigate(navigate, {
      to: myAdminRoutes.usersDetail(String(userId)),
      params: { userId: String(userId) },
    })

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={myAdminRoutes.rolesList} label="Back to Roles & Permissions" />

      {actionError && (
        <div
          className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error"
          role="alert"
        >
          <span className="material-symbols-outlined shrink-0 text-[20px]">error</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-background">Action failed</p>
            <p className="break-words">{actionError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                role.category === 'Core Role'
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-surface-container text-on-surface-variant',
              )}
            >
              {role.category}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                role.status === 'Active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-surface-container text-on-surface-variant',
              )}
            >
              {role.status}
            </span>
            {role.status === 'Archived' && <ArchivedBadge />}
          </div>
          <PageHeader title={role.name} description={role.description} />
        </div>
        <div className="flex gap-2">
          <Can action={Action.UPDATE} resource="role">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
              onClick={goEdit}
            >
              Edit Role
            </Button>
          </Can>
          {role.status !== 'Archived' && (
            <Can action={Action.DELETE} resource="role">
              <DeleteButton
                iconOnly
                entityLabel={role.name}
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutateAsync()}
              />
            </Can>
          )}
          {role.status === 'Archived' && (
            <Can action={Action.UPDATE} resource="role">
              <Button
                variant="outline"
                size="sm"
                className="border-secondary text-secondary hover:bg-secondary/10"
                leftIcon={
                  <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
                }
                isLoading={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate()}
              >
                Restore
              </Button>
            </Can>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bv-surface p-6 space-y-4">
            <h3 className="text-title-lg font-semibold text-on-background">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Users assigned</p>
                <p className="text-2xl font-bold text-on-background">{role.usersCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Coverage</p>
                <p className="text-body-md font-semibold text-secondary">{role.coverageLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Created</p>
                <p className="text-body-sm text-on-surface">{role.created}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">Updated</p>
                <p className="text-body-sm text-on-surface">{role.updated}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-label-sm mb-1">
                <span className="text-on-surface-variant">Access coverage</span>
                <span className="font-medium">{role.coveragePct}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: `${role.coveragePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bv-surface p-6">
          <h3 className="text-title-lg font-semibold text-on-background mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">key</span>
            Permissions
          </h3>
          {role.permissions.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No permissions listed for this role.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(role.permissionDetails && role.permissionDetails.length > 0
                ? role.permissionDetails.map((d) => ({
                    key: d.key || `${d.resource}.${d.action}`.toLowerCase(),
                    label: d.key || `${d.resource}.${d.action}`.toLowerCase(),
                    scope: d.scope,
                    permission_id: d.permission_id,
                    scope_id: d.scope_id,
                  }))
                : role.permissions.map((p) => ({
                    key: p,
                    label: p,
                    scope: null as string | null,
                    permission_id: 0,
                    scope_id: 0,
                  }))
              ).map((g) => (
                <li
                  key={`${g.key}-${g.scope ?? ''}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                  <span className="text-body-sm font-mono text-on-background flex-1 truncate">{g.label}</span>
                  {g.scope && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                      {g.scope}
                    </span>
                  )}
                  {g.permission_id > 0 && g.scope_id > 0 && (
                    <DeleteButton
                      iconOnly
                      entityLabel={`${g.label} (${g.scope})`}
                      disabled={revokeMutation.isPending}
                      isLoading={revokeMutation.isPending}
                      onConfirm={() =>
                        revokeMutation.mutate({
                          permission_id: g.permission_id,
                          scope_id: g.scope_id,
                        })
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">group</span>
            Assigned Employees
          </h3>
          <span className="text-label-sm text-on-surface-variant">{assigned.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          {assigned.length === 0 ? (
            <p className="p-8 text-center text-on-surface-variant text-body-sm">
              No users currently matched to this role name.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Employee</th>
                  <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Department</th>
                  <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Status</th>
                  <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {assigned.map((u) => (
                  <tr key={u.id} className="zebra-row cursor-pointer" onClick={() => goUser(u.id)}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                          {u.initials}
                        </div>
                        <div>
                          <p className="font-medium text-on-background">{u.name}</p>
                          <p className="text-body-sm text-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant">{u.department}</td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          u.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : u.status === 'Locked'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-surface-container text-on-surface-variant',
                        )}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant">{u.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
