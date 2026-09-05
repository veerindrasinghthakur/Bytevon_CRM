import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { queryKeys } from '@/shared/lib/query-keys'
import { listMyApprovals, getMyWorkOverview } from '../api/my-work'
import { statusStyles, approvalTypeIcon } from '../schemas/enums'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'

export function MyApprovalDetailPage() {
  const { requestId } = useParams({ strict: false }) as { requestId: string }
  const navigate = useNavigate()

  const listQuery = useQuery({
    queryKey: queryKeys.myWork.approvals.list({ pageSize: 100 }),
    queryFn: () => listMyApprovals({ pageSize: 100 }),
  })

  const overviewQuery = useQuery({
    queryKey: queryKeys.myWork.overview(),
    queryFn: getMyWorkOverview,
  })

  if (listQuery.isLoading) return <PageLoadingSkeleton />

  const item =
    listQuery.data?.items.find((a) => a.id === requestId) ?? listQuery.data?.items[0]
  const user = overviewQuery.data?.user

  if (!item) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Approval details" showBack backTo={myWorkRoutes.approvals} />
        <p className="text-body-md text-on-surface-variant">Request not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={item.title} description={item.type} showBack backTo={myWorkRoutes.approvals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-6">
          <section className="bv-surface p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {approvalTypeIcon[item.type] ?? 'description'}
                </span>
              </div>
              <div>
                <h3 className="text-title-lg text-on-background">Overview</h3>
                <p className="text-body-md text-on-surface-variant mt-2">
                  {item.summary ?? 'No additional summary provided for this request.'}
                </p>
              </div>
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg text-on-background mb-3">History</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-body-md">
                <span className="material-symbols-outlined text-secondary text-xl">send</span>
                <div>
                  <p className="font-medium text-on-background">Submitted by {user?.name ?? '—'}</p>
                  <p className="text-label-sm text-on-surface-variant">{item.submittedOn}</p>
                </div>
              </li>
              {item.status === 'Approved' && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
                  <div>
                    <p className="font-medium text-on-background">Approved</p>
                    <p className="text-label-sm text-on-surface-variant">Decision recorded</p>
                  </div>
                </li>
              )}
              {item.status === 'Pending' && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-[var(--color-warning-amber)] text-xl">
                    pending
                  </span>
                  <div>
                    <p className="font-medium text-on-background">Pending review</p>
                    <p className="text-label-sm text-on-surface-variant">Waiting for approver</p>
                  </div>
                </li>
              )}
              {item.status === 'Rejected' && (
                <li className="flex gap-3 text-body-md">
                  <span className="material-symbols-outlined text-error text-xl">cancel</span>
                  <div>
                    <p className="font-medium text-on-background">Rejected</p>
                    <p className="text-label-sm text-on-surface-variant">See notes from approver when available</p>
                  </div>
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <section className="bv-surface p-6">
            <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Status</h3>
            <span
              className={cn(
                'inline-flex px-2.5 py-1 rounded-full text-label-sm font-semibold',
                statusStyles[item.status] ?? statusStyles.Pending,
              )}
            >
              {item.status}
            </span>
          </section>

          <section className="bv-surface p-6 space-y-4">
            <div>
              <p className="text-label-sm text-on-surface-variant">Type</p>
              <p className="text-body-md text-on-surface mt-0.5">{item.type}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Submitted</p>
              <p className="text-body-md text-on-surface mt-0.5">{item.submittedOn}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Requester</p>
              <p className="text-body-md text-on-surface mt-0.5">{user?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Summary</p>
              <p className="text-body-md text-on-surface mt-0.5">{item.summary ?? '—'}</p>
            </div>
          </section>

          <section className="bv-surface p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => safeNavigate(navigate, { to: myWorkRoutes.approvals })}
            >
              All my approvals
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => safeNavigate(navigate, { to: myWorkRoutes.requests })}
            >
              Open full requests table
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
