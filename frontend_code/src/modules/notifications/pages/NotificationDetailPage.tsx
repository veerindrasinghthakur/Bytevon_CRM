import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import {
  useMarkNotificationRead,
  useNotificationDetail,
} from '../hooks/use-notifications'
import { archiveNotification } from '../api/notifications'
import { invalidate } from '@/shared/lib/query-keys'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { notificationRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'

export function NotificationDetailPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { notificationId } = useParams({ from: '/notifications/$notificationId' as never }) as {
    notificationId: string
  }

  const { data: n, isLoading, isError, refetch } = useNotificationDetail(notificationId)
  const markRead = useMarkNotificationRead()

  const archiveMut = useMutation({
    mutationFn: archiveNotification,
    onSuccess: () => {
      void invalidate.notifications(qc)
      safeNavigate(navigate, { to: notificationRoutes.center })
    },
  })

  if (isLoading) {
    return <div className="py-16 text-center text-on-surface-variant">Loading notification…</div>
  }

  if (isError || !n) {
    return (
      <ErrorState
        title="Notification not found"
        description="This notification may have been archived or the link is invalid."
        onRetry={() => void refetch()}
        onBack={() => safeNavigate(navigate, { to: notificationRoutes.center })}
      />
    )
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <BackButton to={notificationRoutes.center} label="Back to inbox" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bv-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-headline-md font-semibold text-on-background">{n.title}</h1>
                  {(n.priority === 'Critical' || n.priority === 'High') && (
                    <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-label-sm uppercase flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">warning</span> {n.priority}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span> {n.module}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span> {n.createdAt}
                  </span>
                  {n.actor && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">person</span> {n.actor}
                      {n.employeeId ? ` · ${n.employeeId}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <hr className="border-outline-variant my-4" />
            <h3 className="text-label-md text-on-surface-variant uppercase mb-2 tracking-wider">Alert Details</h3>
            <div
              className={cn(
                'p-4 rounded-lg border-l-4',
                n.priority === 'Critical' || n.priority === 'High'
                  ? 'bg-surface-container-low border-error'
                  : 'bg-surface-container-low border-secondary',
              )}
            >
              <p className="text-body-md text-on-surface leading-relaxed">{n.body}</p>
              {n.note && <p className="text-body-md text-on-surface mt-3 leading-relaxed">{n.note}</p>}
            </div>

            {n.meta && n.meta.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {n.meta.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between text-label-md border-b border-dashed border-outline-variant pb-2"
                  >
                    <span className="text-on-surface-variant font-semibold">{m.label}</span>
                    <span className="text-on-background font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            {n.timeline && n.timeline.length > 0 && (
              <div className="mt-8 space-y-4">
                <h5 className="text-label-md font-bold uppercase text-on-surface-variant tracking-widest">
                  Activity Timeline
                </h5>
                <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                  {n.timeline.map((t) => (
                    <div key={t.title} className="relative">
                      <div
                        className={cn(
                          'absolute -left-8 top-1 w-6 h-6 rounded-full bg-surface-container-lowest border-4 z-10',
                          t.active ? 'border-secondary' : 'border-outline-variant',
                        )}
                      />
                      <p className="text-body-md font-bold text-on-background">{t.title}</p>
                      <p className="text-label-sm text-on-surface-variant">{t.time}</p>
                      <p className="text-body-sm mt-1 text-on-surface-variant">{t.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="bv-surface p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="md"
                leftIcon={<span className="material-symbols-outlined text-[20px]">check_circle</span>}
                onClick={() => markRead.mutate(n.id)}
                isLoading={markRead.isPending}
              >
                {n.status === 'Unread' ? 'Mark as Read' : 'Marked Read'}
              </Button>
              <Button
                variant="outline"
                size="md"
                leftIcon={<span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>}
                disabled={!n.relatedHref}
                onClick={() => {
                  if (n.relatedHref) safeNavigate(navigate, { to: n.relatedHref as never })
                }}
              >
                Open Related
              </Button>
            </div>
            <Button
              variant="outline"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[20px]">archive</span>}
              isLoading={archiveMut.isPending}
              onClick={() => archiveMut.mutate(n.id)}
            >
              Archive
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bv-surface overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant">
              <h2 className="text-title-lg font-semibold text-on-background">Delivery Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">
                  Sender
                </label>
                <div className="flex items-center gap-2 text-on-background">
                  <span className="material-symbols-outlined text-secondary">memory</span>
                  <p className="text-body-md font-medium">System Engine</p>
                </div>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">
                  Priority
                </label>
                <p className="text-body-md font-medium text-on-background">{n.priority}</p>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">
                  Status
                </label>
                <p className="text-body-md font-medium text-on-background">{n.status}</p>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">
                  Channels
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-surface-container px-2.5 py-1 rounded-full text-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">notifications</span> In-App
                  </span>
                  <span className="bg-surface-container px-2.5 py-1 rounded-full text-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">mail</span> Email
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2">V1: IN_APP + EMAIL only</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
