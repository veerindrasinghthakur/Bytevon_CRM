import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'

export type Crumb = { label: string; to?: string }

/** Pretty labels for known path segments (route-driven, not page-file names). */
const SEGMENT_LABELS: Record<string, string> = {
  workforce: 'Workforce',
  employees: 'Employees',
  departments: 'Departments',
  teams: 'Teams',
  attendance: 'Attendance',
  members: 'Members',
  projects: 'Project History',
  edit: 'Edit',
  'add-member': 'Add Member',
  'assign-project': 'Assign Project',
  new: 'New',
  sales: 'Sales',
  projects_mod: 'Projects',
  'my-work': 'My Work',
  leave: 'Leave',
  approvals: 'Approvals',
  admin: 'Administration',
}

function labelForSegment(segment: string, index: number, all: string[]): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  // id-looking segments: leave as-is (caller can override last label)
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
  options?: {
    /** Override labels by full path or by last segment value */
    labelOverrides?: Record<string, string>
    /** Hide root-only paths that only redirect (e.g. skip linking /workforce if it redirects) */
    rootTo?: string
  },
): Crumb[] {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return []

  const overrides = options?.labelOverrides ?? {}
  const crumbs: Crumb[] = []

  parts.forEach((segment, i) => {
    const path = '/' + parts.slice(0, i + 1).join('/')
    const isLast = i === parts.length - 1
    let label =
      overrides[path] ??
      overrides[segment] ??
      labelForSegment(segment, i, parts)

    // Prefer a sensible home for module root
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
}: {
  items: Crumb[]
  className?: string
}) {
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
              <Link to={item.to} className="hover:text-secondary hover:underline">
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
}: {
  lastLabel?: string
  labelOverrides?: Record<string, string>
  className?: string
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const overrides = { ...labelOverrides }
  if (lastLabel) {
    overrides[pathname] = lastLabel
  }
  const items = crumbsFromPathname(pathname, { labelOverrides: overrides })
  return <RouteCrumbs items={items} className={className} />
}
