import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { cn } from '@/shared/lib/cn'
import { approvalPriorityStyles } from '../lib/approval-enums'
import type { ApprovalRow } from '../types/request.types'

export function PendingApprovalsTable({
  filtered,
  pendingTotal,
  isLoading,
  isFetching,
  onOpenRow,
}: {
  filtered: ApprovalRow[]
  pendingTotal: number
  isLoading: boolean
  isFetching: boolean
  onOpenRow: (row: ApprovalRow) => void
}) {
  return (
    <section className="bv-surface overflow-hidden relative">
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
          <TableSkeleton rows={5} />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">ID</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Type</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Requester</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Date</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Priority</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Status</th>
              {/* Actions column hidden — row click opens quick view → full record.
                  Restore the block below when row actions return.
              <th className="px-6 py-4 text-label-md text-on-surface-variant text-right">Actions</th>
              */}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="zebra-row cursor-pointer"
                onClick={() => onOpenRow(row)}
              >
                <td className="px-6 py-4 text-body-sm font-medium">#{row.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={cn('p-1.5 rounded-md material-symbols-outlined text-[18px] bg-secondary/10 text-secondary')}>
                      {row.typeIcon}
                    </span>
                    <span className="text-body-sm">{row.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center text-label-sm font-bold text-secondary">
                      {row.requesterInitials}
                    </div>
                    <span className="text-body-sm">{row.requester}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant">{row.date}</td>
                <td className="px-6 py-4">
                  <span className={approvalPriorityStyles[row.priority] ?? 'status-badge status-neutral'}>
                    {row.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="status-badge status-info">{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
        <span className="text-body-sm text-on-surface-variant">
          Showing {filtered.length} of {pendingTotal} pending requests
        </span>
      </div>
    </section>
  )
}
