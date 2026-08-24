import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { usePositions } from '../../hooks/use-organization'
import { cn } from '@/shared/lib/cn'

export function PositionsListPage() {
  const { data, isLoading, isError, error, refetch } = usePositions(true)
  const items = data?.items ?? []

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Positions" description="Job positions assigned via employment_assignments" />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">Name</th>
              <th className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-outline-variant last:border-0 bv-row-hover">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
