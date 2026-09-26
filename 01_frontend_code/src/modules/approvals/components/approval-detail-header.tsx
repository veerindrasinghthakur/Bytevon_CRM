import { PageHeader } from '@/shared/components/layout/PageHeader'
import type { ApprovalRow } from '../types/request.types'

export function ApprovalDetailHeader({ row }: { row: ApprovalRow }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-label-sm font-bold text-on-surface-variant tracking-wider uppercase">
            Request ID
          </span>
          <span className="bg-secondary/15 text-secondary px-3 py-1 rounded-full text-label-sm font-bold">
            #{row.id}
          </span>
        </div>
        <PageHeader
          title={`${row.type} — ${row.requester}`}
          description="Review details and take an approval action."
        />
      </div>
      <span className="bg-surface-container-highest text-secondary inline-flex items-center gap-2 px-4 py-2 rounded-lg font-label-md self-start">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          hourglass_empty
        </span>
        Pending Approval
      </span>
    </div>
  )
}
