import { useEffect, useState } from 'react'
import { useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useDeletedRedirect } from '@/shared/hooks/useDeletedRedirect'
import { createPosition, getPosition, updatePosition, deletePosition, restorePosition } from '@/modules/admin/api/organization'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import { ArchivedBadge } from '@/shared/components/ui/ArchivedBadge'
import { cn } from '@/shared/lib/cn'
import { queryKeys } from '@/shared/lib/query-keys'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

export function PositionDetailPage({ basePath = '/workforce/positions' }: { basePath?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isNew = pathname.endsWith('/positions/new')
  const { positionId } = useParams({ strict: false }) as { positionId?: string }
  const id = Number(positionId)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const detailQuery = useQuery({
    queryKey: queryKeys.organization.positions(true),
    queryFn: () => getPosition(id),
    enabled: !isNew && Number.isFinite(id),
  })

  useDeletedRedirect({
    ready: !isNew && !detailQuery.isLoading,
    data: isNew ? {} : (detailQuery.data ?? null),
    error: detailQuery.error,
    listTo: basePath,
  })

  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(isNew)
  const [name, setName] = useState('')

  useEffect(() => {
    if (detailQuery.data && !isEditing) setName(detailQuery.data.name)
  }, [detailQuery.data, isEditing])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required')
      if (isNew) return createPosition({ name: name.trim() })
      return updatePosition(id, { name: name.trim() })
    },
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.positions(true) })
      if (isNew) {
        safeNavigate(navigate, {
          to: `${basePath}/$positionId`,
          params: { positionId: String(row.id) },
        })
      } else {
        finishEditing()
      }
    },
    onError: () => {
      // Errors surface via saveMut.error in the UI
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => deletePosition(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.positions(true) })
      safeNavigate(navigate, { to: basePath })
    },
  })

  const restoreMut = useMutation({
    mutationFn: () => restorePosition(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.organization.positions(true) })
      await detailQuery.refetch()
    },
  })

  if (!isNew && detailQuery.isLoading) return <PageLoadingSkeleton />
  if (!isNew && (detailQuery.isError || !detailQuery.data)) {
    return (
      <ErrorState
        description={(detailQuery.error as Error)?.message ?? 'Position not found'}
        onRetry={() => void detailQuery.refetch()}
        onBack={() => safeNavigate(navigate, { to: basePath })}
      />
    )
  }

  const pos = detailQuery.data

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={basePath} label="Back to positions" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">
            {isNew ? 'Create position' : pos?.name}
          </h2>
          {!isNew && pos && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Position #{pos.id} ·{' '}
              <span className={cn(pos.is_archived ? 'text-on-surface-variant' : 'text-secondary')}>
                {pos.is_archived ? 'Archived' : 'Active'}
              </span>
            </p>
          )}
          {!isNew && pos?.is_archived && (
            <div className="mt-1.5">
              <ArchivedBadge />
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (pos) setName(pos.name)
                  cancelEditing()
                }}
              >
                Cancel
              </Button>
            )}
            <Can action={Action.CREATE} resource="position">
              <Can action={Action.UPDATE} resource="position">
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={saveMut.isPending}
                  onClick={() => saveMut.mutate()}
                >
                  {isNew ? 'Create' : 'Save'}
                </Button>
              </Can>
            </Can>
          </div>
        ) : (
          <div className="flex gap-2">
            <Can action={Action.UPDATE} resource="position">
              <EditButton variant="outline" onClick={startEditing} />
            </Can>
            {!isNew && pos && !pos.is_archived && (
              <Can action={Action.DELETE} resource="position">
                <DeleteButton
                  iconOnly
                  entityLabel={pos.name}
                  isLoading={deleteMut.isPending}
                  onConfirm={() => deleteMut.mutateAsync()}
                />
              </Can>
            )}
            {!isNew && pos?.is_archived && (
              <Can action={Action.UPDATE} resource="position">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-secondary text-secondary hover:bg-secondary/10"
                  leftIcon={
                    <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
                  }
                  isLoading={restoreMut.isPending}
                  onClick={() => restoreMut.mutate()}
                >
                  Restore
                </Button>
              </Can>
            )}
          </div>
        )}
      </div>

      <div className="bv-surface p-6 max-w-lg space-y-4">
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase">Name</label>
          {isEditing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-secondary"
              placeholder="e.g. Software Engineer"
            />
          ) : (
            <p className="text-body-md font-medium mt-1">{pos?.name}</p>
          )}
        </div>
        {saveMut.isError && (
          <p className="text-body-sm text-error">{(saveMut.error as Error).message}</p>
        )}
      </div>
    </div>
  )
}
