import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { looseSearch } from '@/shared/lib/safeNavigate'
import { WORKFORCE_ROUTE_SEGMENT_LABELS } from '../schemas/enums'
import type { Crumb, CrumbsFromPathOptions, DynamicRouteCrumbsProps, RouteCrumbsProps } from '../types'

export type { Crumb } from '../types'

/** Pretty labels for known path segments (route-driven, not page-file names). */
function labelForSegment(segment: string): string {
  if (WORKFORCE_ROUTE_SEGMENT_LABELS[segment]) return WORKFORCE_ROUTE_SEGMENT_LABELS[segment]
  if (/^[a-z]?\d+$/i.test(segment) || segment.length <= 4) return segment
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Build crumbs from the live URL path so each link is the real cumulative route.
 * Example: /workforce/attendance/employees
 *   → Workforce (/workforce) · Attendance (/workforce/attendance) · Employees
 */
export function crumbsFromPathname(
  pathname: string,
  options?: CrumbsFromPathOptions,
): Crumb[] {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return []

  const overrides = options?.labelOverrides ?? {}
  const crumbs: Crumb[] = []

  parts.forEach((segment, i) => {
    const path = '/' + parts.slice(0, i + 1).join('/')
    const isLast = i === parts.length - 1
    const label = overrides[path] ?? overrides[segment] ?? labelForSegment(segment)

    let to: string | undefined = isLast ? undefined : path
    if (i === 0 && options?.rootTo) {
      to = isLast ? undefined : options.rootTo
    }

    crumbs.push({ label, to })
  })

  return crumbs
}

export function RouteCrumbs({
  items,
  className,
}: RouteCrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex flex-wrap items-center gap-1 text-label-sm text-on-surface-variant',
        className,
      )}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span
                className="material-symbols-outlined text-base text-on-surface-variant/70"
                aria-hidden
              >
                chevron_right
              </span>
            )}
            {item.to && !last ? (
              <Link to={item.to} search={looseSearch()} className="hover:text-secondary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={cn(last && 'font-medium text-on-background')}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/**
 * Breadcrumbs driven by the current location.pathname.
 * Pass `lastLabel` to replace the final segment (e.g. employee name).
 */
export function DynamicRouteCrumbs({
  lastLabel,
  labelOverrides,
  className,
}: DynamicRouteCrumbsProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const overrides = { ...labelOverrides }
  if (lastLabel) {
    overrides[pathname] = lastLabel
  }
  const items = crumbsFromPathname(pathname, { labelOverrides: overrides })
  return <RouteCrumbs items={items} className={className} />
}
