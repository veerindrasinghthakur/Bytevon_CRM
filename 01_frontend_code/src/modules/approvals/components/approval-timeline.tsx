import { TimelineStep } from '@/shared/components/ui/TimelineStep'

export function ApprovalTimeline({ requester, date }: { requester: string; date: string }) {
  return (
    <div className="bv-surface p-6">
      <h4 className="text-title-lg font-semibold text-on-background mb-8">Approval Timeline</h4>
      <div className="relative space-y-8 pl-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant">
        <TimelineStep done title="Request Submitted" body={`${requester} submitted the request.`} time={date} />
        <TimelineStep done title="Policy check" body="Automated policy compliance confirmed." time={date} />
        <TimelineStep active title="Manager review" body="Awaiting your decision." time="Now" />
        <TimelineStep title="Final notification" body="Requester notified and records updated." muted />
      </div>
    </div>
  )
}
