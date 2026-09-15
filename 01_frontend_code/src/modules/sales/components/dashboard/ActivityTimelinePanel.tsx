import { typeIcon } from '../../schemas/enums'

type ActivityItem = {
  id: string
  type: string
  title: string
  body: string
  actor: string
  time: string
}

type Props = {
  activityGroups: Record<string, ActivityItem[]>
}

/** Grouped activity feed panel. */
export function ActivityTimelinePanel({ activityGroups }: Props) {
  const safe = activityGroups ?? {}

  return (
    <div className="bv-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant">
        <h2 className="text-title-md font-semibold text-on-background">Activity timeline</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Merged from Sales Activity</p>
      </div>
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin p-4 space-y-6">
        {Object.entries(safe).map(([dateGroup, items]) => (
          <section key={dateGroup}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              {dateGroup}
            </h3>
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">
                      {typeIcon[a.type as keyof typeof typeIcon] ?? 'circle'}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-on-surface">{a.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{a.body}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      {a.actor} · {a.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
