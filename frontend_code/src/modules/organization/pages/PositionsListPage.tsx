import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getPositions } from '../api/organization'
import type { PositionRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

export function PositionsListPage() {
  const [items, setItems] = useState<PositionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPositions({ includeArchived: true })
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoadingSkeleton />
  if (error) return <ErrorState description={error} />

  return (
    <div className="space-y-6">
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
