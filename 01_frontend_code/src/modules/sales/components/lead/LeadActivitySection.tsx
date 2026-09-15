import { Link } from '@tanstack/react-router'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { activityIcon } from '../../schemas/enums'
import { salesRoutes } from '../../routes'

type ActivityItem = {
  id: string
  type: string
  title: string
  body: string
  actor: string
  time: string
}

type Props = {
  timeline: ActivityItem[]
}

/** Recent activity timeline for lead detail. */
export function LeadActivitySection({ timeline }: Props) {
  return (
    <section className="bv-surface p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-title-md font-semibold">Activity</h2>
        <Link
          {...looseLinkProps({
            to: salesRoutes.activity,
            className: 'text-secondary text-sm font-semibold hover:underline',
          })}
        >
          Full timeline
        </Link>
      </div>
      <div className="space-y-0 relative">
        {timeline.map((a, idx) => (
          <div key={a.id} className={cn('relative flex gap-4', idx < timeline.length - 1 && 'pb-6')}>
            {idx < timeline.length - 1 && (
              <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-outline-variant" aria-hidden />
            )}
            <div className="z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary/15 text-secondary">
              <span className="material-symbols-outlined text-xs">
                {activityIcon[a.type] ?? 'circle'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-on-surface">{a.title}</p>
              <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{a.body}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {a.actor} · {a.time}
              </p>
            </div>
          </div>
        ))}
        {timeline.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No recent activity.</p>
        )}
      </div>
    </section>
  )
}
