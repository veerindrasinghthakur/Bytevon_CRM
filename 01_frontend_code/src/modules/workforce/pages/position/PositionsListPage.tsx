import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { usePositions } from '@/modules/admin/hooks/position/use-positions'
import type { PositionRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'

export function PositionsListPage({ basePath = '/workforce/positions' }: { basePath?: string }) {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch, deletePosition, isMutating } = usePositions(true)
  const items: PositionRow[] = data?.items ?? []

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Positions"
        description="Job positions assigned via employment_assignments"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => safeNavigate(navigate, { to: `${basePath}/new` })}
          >
            Create Position
          </Button>
        }
      />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">Name</th>
              <th className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">Status</th>
              {/* Actions column hidden — row click opens detail. Restore when needed.
              <th className="px-5 py-3 text-label-sm uppercase text-on-surface-variant text-right">Actions</th>
              */}
            </tr>
          </thead>
          <tbody>
            {items.map((p: PositionRow) => (
              <tr
                key={p.id}
                className="border-b border-outline-variant last:border-0 bv-row-hover cursor-pointer"
                onClick={() =>
                  safeNavigate(navigate, {
                    to: `${basePath}/$positionId`,
                    params: { positionId: String(p.id) },
                  })
                }
              >
                <td className="px-5 py-3 font-medium">{p.name}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                      p.is_archived
                        ? 'bg-surface-container text-on-surface-variant'
                        : 'bg-secondary/15 text-secondary',
                    )}
                  >
                    {p.is_archived ? 'ARCHIVED' : 'ACTIVE'}
                  </span>
                </td>
                {/* Row delete hidden with the Actions column — detail page keeps it.
                <td
                  className="px-5 py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!p.is_archived && (
                    <DeleteButton
                      iconOnly
                      entityLabel={p.name}
                      disabled={isMutating}
                      onConfirm={() => deletePosition(p.id)}
                    />
                  )}
                </td>
                */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

