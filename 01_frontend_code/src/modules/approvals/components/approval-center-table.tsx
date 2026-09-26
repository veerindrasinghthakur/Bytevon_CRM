import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { approvalPriorityStyles } from '../lib/approval-enums'
import type { ApprovalRow } from '../types/request.types'

export function ApprovalCenterTable({
  rows,
  header,
  onRowClick,
}: {
  rows: ApprovalRow[]
  header: ReactNode
  onRowClick: () => void
}) {
  return (
    <section className="bv-surface overflow-hidden">
      {header}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Requester</th>
              <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Status</th>
              {/* Actions column hidden (quick approve/reject/view) — row click opens
                  pending list. Restore the block below when row actions return.
              <th className="px-6 py-3 text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Actions</th>
              */}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="zebra-row cursor-pointer"
                onClick={onRowClick}
              >
                <td className="px-6 py-4 font-medium text-secondary">#{row.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn('p-1.5 rounded-md bg-secondary/10 text-secondary')}>
                      <span className="material-symbols-outlined text-[16px]">{row.typeIcon}</span>
                    </span>
                    <span className="text-body-sm font-medium">{row.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-label-sm text-secondary border border-outline-variant">
                      {row.requesterInitials}
                    </div>
                    <span className="text-body-sm">{row.requester}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-sm text-on-surface-variant">{row.date}</td>
                <td className="px-6 py-4">
                  <span className={cn('px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide', approvalPriorityStyles[row.priority])}>
                    {row.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-bold text-label-sm">
                    <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                    Pending
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
        <Button variant="outline" size="sm">Previous</Button>
        <div className="flex gap-2">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-on-secondary font-bold text-sm">1</span>
          <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-sm transition-colors">2</button>
          <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-sm transition-colors">3</button>
        </div>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </section>
  )
}
