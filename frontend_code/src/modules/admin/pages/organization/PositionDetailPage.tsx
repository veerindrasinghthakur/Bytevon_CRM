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
import { createPosition, getPosition, updatePosition } from '../../api/organization'
import { cn } from '@/shared/lib/cn'

export function PositionDetailPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isNew = pathname.endsWith('/positions/new')
  const { positionId } = useParams({ strict: false }) as { positionId?: string }
  const id = Number(positionId)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['organization', 'positions', id],
    queryFn: () => getPosition(id),
    enabled: !isNew && Number.isFinite(id),
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
      await qc.invalidateQueries({ queryKey: ['organization', 'positions'] })
      if (isNew) {
        safeNavigate(navigate, {
          to: '/admin/settings/positions/$positionId',
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

  if (!isNew && detailQuery.isLoading) return <PageLoadingSkeleton />
  if (!isNew && (detailQuery.isError || !detailQuery.data)) {
    return (
      <ErrorState
        description={(detailQuery.error as Error)?.message ?? 'Position not found'}
        onRetry={() => void detailQuery.refetch()}
        onBack={() => safeNavigate(navigate, { to: '/admin/settings/positions' })}
      />
    )
  }

  const pos = detailQuery.data

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/admin/settings/positions" label="Back to positions" />
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
            <Button
              variant="primary"
              size="sm"
              isLoading={saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {isNew ? 'Create' : 'Save'}
            </Button>
          </div>
        ) : (
          <EditButton variant="outline" onClick={startEditing} />
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
