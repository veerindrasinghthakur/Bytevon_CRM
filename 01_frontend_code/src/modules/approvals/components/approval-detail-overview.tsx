import type { ApprovalRow } from '../types/request.types'

export function ApprovalDetailOverview({ row }: { row: ApprovalRow }) {
  return (
    <>
      <div className="bv-surface p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-lg border-2 border-secondary/30">
            {row.requesterInitials}
          </div>
          <div>
            <h4 className="text-title-lg font-semibold text-on-background">{row.requester}</h4>
            <p className="text-on-surface-variant text-body-md">Team member · Submitted {row.date}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">Priority</p>
          <p className="text-headline-md font-semibold text-on-background">{row.priority}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bv-surface p-6 space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined">description</span>
            <h4 className="text-label-md font-bold uppercase">Type</h4>
          </div>
          <p className="text-title-lg font-semibold text-on-background">{row.type}</p>
        </div>
        <div className="bv-surface p-6 space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined">calendar_today</span>
            <h4 className="text-label-md font-bold uppercase">Submitted</h4>
          </div>
          <p className="text-title-lg font-semibold text-on-background">{row.date}</p>
        </div>
        <div className="md:col-span-2 bv-surface p-6 space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined">subject</span>
            <h4 className="text-label-md font-bold uppercase">Summary</h4>
          </div>
          <p className="text-body-md text-on-surface leading-relaxed">
            Request #{row.id} from {row.requester} for {row.type}. Review attachments and policy notes before
            deciding.
          </p>
        </div>
      </div>
    </>
  )
}
