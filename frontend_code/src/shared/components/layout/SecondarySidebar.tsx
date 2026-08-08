import { cn } from '@/shared/lib/cn'
import { Link, useRouterState } from '@tanstack/react-router'

export interface SecondaryNavItem {
  id: string
  label: string
  icon: string
  to: string
  badge?: number | string
  visible?: boolean
}

export interface SecondaryNavGroup {
  moduleId: string
  title: string
  items: SecondaryNavItem[]
}

/** Locked secondary nav content per primary module (from docs) */
export const SECONDARY_NAV: Record<string, SecondaryNavGroup> = {
  dashboard: {
    moduleId: 'dashboard',
    title: 'Dashboard',
    items: [],
  },
  sales: {
    moduleId: 'sales',
    title: 'Sales',
    items: [
      { id: 'leads', label: 'Leads', icon: 'person_search', to: '/sales/leads' },
      { id: 'clients', label: 'Clients', icon: 'handshake', to: '/sales/clients' },
      { id: 'analytics', label: 'Analytics', icon: 'analytics', to: '/sales/analytics' },
      { id: 'activity', label: 'Activity', icon: 'timeline', to: '/sales/activity' },
    ],
  },
  projects: {
    moduleId: 'projects',
    title: 'Projects',
    items: [
      { id: 'all-projects', label: 'All Projects', icon: 'account_tree', to: '/projects' },
      { id: 'teams', label: 'Teams', icon: 'groups', to: '/projects/teams' },
      { id: 'tasks', label: 'Tasks', icon: 'assignment', to: '/projects/tasks' },
    ],
  },
  workforce: {
    moduleId: 'workforce',
    title: 'Workforce',
    items: [
      { id: 'employees', label: 'Employees', icon: 'badge', to: '/workforce/employees' },
      { id: 'departments', label: 'Departments', icon: 'domain', to: '/workforce/departments' },
      { id: 'attendance', label: 'Attendance', icon: 'calendar_today', to: '/workforce/attendance' },
    ],
  },
  'my-work': {
    moduleId: 'my-work',
    title: 'My Work',
    items: [
      { id: 'my-attendance', label: 'My Attendance', icon: 'calendar_today', to: '/my-work/attendance' },
      { id: 'my-leave', label: 'My Leave', icon: 'event_busy', to: '/my-work/leave' },
      { id: 'my-tasks', label: 'My Tasks', icon: 'task_alt', to: '/my-work/tasks' },
      { id: 'my-approvals', label: 'My Approvals', icon: 'fact_check', to: '/my-work/approvals' },
    ],
  },
  approvals: {
    moduleId: 'approvals',
    title: 'Approvals',
    items: [
      { id: 'pending', label: 'Pending Approvals', icon: 'pending_actions', to: '/approvals/pending' },
      { id: 'my-requests', label: 'My Requests', icon: 'request_page', to: '/approvals/my-requests' },
    ],
  },
  admin: {
    moduleId: 'admin',
    title: 'Administration',
    items: [
      { id: 'users', label: 'Users', icon: 'manage_accounts', to: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', icon: 'qr_code_2', to: '/admin/roles' },
      { id: 'settings', label: 'Settings', icon: 'settings', to: '/admin/settings' },
      { id: 'audit', label: 'Audit Logs', icon: 'receipt_long', to: '/admin/audit' },
      { id: 'notifications', label: 'Notifications', icon: 'notifications', to: '/admin/notifications' },
    ],
  },
}

function getActiveModule(pathname: string): string {
  if (pathname.startsWith('/sales')) return 'sales'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/workforce')) return 'workforce'
  if (pathname.startsWith('/my-work')) return 'my-work'
  if (pathname.startsWith('/approvals')) return 'approvals'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'dashboard'
}

/** Collapsed secondary sidebar width (icon-only bar) */
export const SECONDARY_COLLAPSED_WIDTH = 64
/** Expanded secondary sidebar width */
export const SECONDARY_EXPANDED_WIDTH = 240

interface SecondarySidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function SecondarySidebar({
  isCollapsed,
  onToggle,
}: SecondarySidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moduleId = getActiveModule(pathname)
  const group = SECONDARY_NAV[moduleId]
  const items = (group?.items ?? []).filter((i) => i.visible !== false)

  // No secondary items for this module (e.g. dashboard) → don't render bar
  if (items.length === 0) {
    return null
  }

  const isItemActive = (to: string) => {
    if (to === '/projects') return pathname === '/projects'
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className={cn(
        'h-full bg-surface-container-lowest border-r border-outline-variant flex flex-col',
        'transition-all duration-300 ease-in-out overflow-hidden shrink-0',
        isCollapsed ? 'w-16' : 'w-60'
      )}
      aria-label="Secondary navigation"
    >
      {/* Header / toggle */}
      <div
        className={cn(
          'border-b border-outline-variant shrink-0 flex items-center',
          isCollapsed ? 'flex-col py-4 gap-2' : 'px-4 py-4 justify-between'
        )}
      >
        {!isCollapsed && (
          <div className="min-w-0">
            <h2 className="text-title-lg text-on-background leading-tight truncate">
              {group?.title ?? 'Workspace'}
            </h2>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">
              Module
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center rounded-lg text-on-surface-variant',
            'hover:bg-surface-container hover:text-on-surface transition-colors',
            isCollapsed ? 'w-10 h-10' : 'w-9 h-9'
          )}
          aria-label={isCollapsed ? 'Expand secondary sidebar' : 'Collapse secondary sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-xl">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      {/* Nav items – icon only when collapsed, icon + label when expanded */}
      <div
        className={cn(
          'flex-1 overflow-y-auto scrollbar-hide',
          isCollapsed ? 'py-3 flex flex-col items-center gap-1' : 'py-4 px-2'
        )}
      >
        {!isCollapsed && group && (
          <h3 className="text-nav-group text-on-surface-variant/70 px-3 mb-2 uppercase">
            {group.title}
          </h3>
        )}

        <ul className={cn('flex flex-col', isCollapsed ? 'gap-1 w-full items-center' : 'gap-1')}>
          {items.map((item) => {
            const active = isItemActive(item.to)
            return (
              <li key={item.id} className={isCollapsed ? 'w-full flex justify-center' : undefined}>
                <Link
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center transition-all duration-200 group relative',
                    isCollapsed
                      ? 'w-10 h-10 justify-center rounded-lg'
                      : 'w-full px-3 py-2.5 rounded-lg gap-3',
                    active
                      ? 'bg-surface-container-high text-on-surface font-medium'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined text-xl shrink-0 transition-colors',
                      active ? 'text-electric-blue' : 'group-hover:text-electric-blue'
                    )}
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <>
                      <span className="text-nav-item flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Badge dot when collapsed */}
                  {isCollapsed && item.badge != null && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-electric-blue" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
