import { useNavigate, useParams } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { inboxNotifications } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function NotificationDetailPage() {
  const navigate = useNavigate()
  const { notificationId } = useParams({ from: '/notifications/$notificationId' as never }) as {
    notificationId: string
  }
  const n = inboxNotifications.find((x) => x.id === notificationId) ?? inboxNotifications[0]

  return (
    <div className="space-y-6 max-w-6xl">
      <nav className="flex items-center gap-2 text-label-md text-on-surface-variant flex-wrap">
        <button type="button" className="hover:text-secondary" onClick={() => navigate({ to: '/notifications' })}>
          Notification Center
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-deep-navy font-semibold">Notification Details</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-headline-md font-semibold text-deep-navy">{n.title}</h1>
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 border border-outline-variant hover:bg-surface-container rounded-lg transition-colors">
                  <span className="material-symbols-outlined">print</span>
                </button>
                <button type="button" className="p-2 border border-outline-variant hover:bg-surface-container rounded-lg transition-colors">
                  <span className="material-symbols-outlined">share</span>
                </button>
              </div>
            </div>
            <hr className="border-outline-variant my-4" />
            <h3 className="text-label-md text-on-surface-variant uppercase mb-2 tracking-wider">Alert Details</h3>
            <div
              className={cn(
                'p-4 rounded-lg border-l-4',
                n.priority === 'Critical' || n.priority === 'High'
                  ? 'bg-surface-container-low border-error'
                  : 'bg-surface-container-low border-secondary'
              )}
            >
              <p className="text-body-md text-on-surface leading-relaxed">{n.body}</p>
              {n.note && <p className="text-body-md text-on-surface mt-3 leading-relaxed">{n.note}</p>}
            </div>
          </section>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md" leftIcon={<span className="material-symbols-outlined text-[20px]">check_circle</span>}>
                Mark as Resolved
              </Button>
              <Button variant="outline" size="md" leftIcon={<span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>}>
                Open Related
              </Button>
            </div>
            <Button variant="outline" size="md" leftIcon={<span className="material-symbols-outlined text-[20px]">archive</span>}>
              Archive
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant">
              <h2 className="text-title-lg font-semibold text-deep-navy">Delivery Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Sender</label>
                <div className="flex items-center gap-2 text-deep-navy">
                  <span className="material-symbols-outlined text-secondary">memory</span>
                  <p className="text-body-md font-medium">System Engine</p>
                </div>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Priority</label>
                <p className="text-body-md font-medium text-deep-navy">{n.priority}</p>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Status</label>
                <p className="text-body-md font-medium text-deep-navy">{n.status}</p>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Channels</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-surface-container px-2.5 py-1 rounded-full text-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">notifications</span> In-App
                  </span>
                  <span className="bg-surface-container px-2.5 py-1 rounded-full text-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">mail</span> Email
                  </span>
                </div>
              </div>
            </div>
          </section>

          <Button variant="outline" size="md" className="w-full" onClick={() => navigate({ to: '/notifications' })}>
            Back to inbox
          </Button>
        </div>
      </div>
    </div>
  )
}
