import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Link } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { salesRoutes } from '../routes'
import { useSalesActivities } from '../hooks/use-sales'
import { typeIcon, typeColor } from '../schemas/cssTokens'
import type { SalesActivity } from '../types'

export function SalesActivityTimelinePage() {
  const { data: activities, isLoading, isError } = useSalesActivities()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Activity Timeline" showBack backTo={salesRoutes.root} backLabel="Back to sales" />
        <div>Loading...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="animate-fade-in text-center py-16 space-y-4">
        <PageHeader title="Error loading activity" showBack backTo={salesRoutes.root} backLabel="Back to sales" />
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const list: SalesActivity[] = activities ?? []
  const groups = list.reduce<Record<string, SalesActivity[]>>((acc, a) => {
    ;(acc[a.dateGroup] ??= []).push(a)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Activity Timeline"
        description="Chronological sales events across leads and clients."
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link {...looseLinkProps({ to: salesRoutes.root, className: 'hover:text-secondary' })}>
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
                      'absolute -left-[1.9rem] top-1 w-8 h-8 rounded-full flex items-center justify-center executive-shadow',
                      typeColor[a.type] ?? 'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    <span className="material-symbols-outlined text-base">{typeIcon[a.type] ?? 'circle'}</span>
                  </span>
                  <div className="bv-surface p-4">
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
