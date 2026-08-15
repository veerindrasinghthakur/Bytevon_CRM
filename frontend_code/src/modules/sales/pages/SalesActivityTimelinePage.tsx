import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { salesActivities } from '../data/mock'
import type { ActivityType } from '../types'
import { cn } from '@/shared/lib/cn'

const typeIcon: Record<ActivityType, string> = {
  'Lead Created': 'person_add',
  'Lead Won': 'emoji_events',
  'Meeting Scheduled': 'event',
  'Email Sent': 'mail',
  Call: 'call',
  'Document Viewed': 'description',
  'System Alert': 'warning',
  'Contract Renewed': 'autorenew',
  'Proposal Sent': 'send',
}

const typeColor: Partial<Record<ActivityType, string>> = {
  'Lead Won': 'bg-emerald-100 text-emerald-700',
  'System Alert': 'bg-red-50 text-red-700',
  'Meeting Scheduled': 'bg-blue-50 text-blue-700',
  'Lead Created': 'bg-secondary/10 text-secondary',
}

export function SalesActivityTimelinePage() {
  const groups = salesActivities.reduce<Record<string, typeof salesActivities>>((acc, a) => {
    ;(acc[a.dateGroup] ??= []).push(a)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Timeline"
        description="Chronological sales events across leads and clients."
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">Activity</span>
          </nav>
        }
      />

      <div className="max-w-3xl space-y-8">
        {Object.entries(groups).map(([dateGroup, items]) => (
          <section key={dateGroup}>
            <h2 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              {dateGroup}
            </h2>
            <ol className="relative border-l-2 border-outline-variant ml-3 space-y-6">
              {items.map((a) => (
                <li key={a.id} className="ml-6 relative">
                  <span
                    className={cn(
                      'absolute -left-[1.9rem] top-1 w-8 h-8 rounded-full flex items-center justify-center',
                      typeColor[a.type] ?? 'bg-surface-container text-on-surface-variant'
                    )}
                  >
                    <span className="material-symbols-outlined text-base">{typeIcon[a.type] ?? 'circle'}</span>
                  </span>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{a.title}</p>
                        <p className="text-body-sm text-on-surface-variant mt-1">{a.body}</p>
                      </div>
                      <span className="text-xs text-on-surface-variant whitespace-nowrap">{a.time}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-xs text-on-surface-variant">{a.actor}</span>
                      {a.tag && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                          {a.tag}
                        </span>
                      )}
                      {a.linkLabel && (
                        <span className="text-xs font-semibold text-secondary">{a.linkLabel}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}
