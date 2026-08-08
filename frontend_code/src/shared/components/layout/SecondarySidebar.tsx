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

export const SECONDARY_COLLAPSED_WIDTH = 64
export const SECONDARY_EXPANDED_WIDTH = 240

interface SecondarySidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

/**
 * Secondary sidebar — item vertical rhythm aligned with IconRail (py-3.5 / gap-1).
 * Header block mirrors rail: toggle first, then content margin below collapse control.
 */
export function SecondarySidebar({ isCollapsed, onToggle }: SecondarySidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moduleId = getActiveModule(pathname)
  const group = SECONDARY_NAV[moduleId]
  const items = (group?.items ?? []).filter((i) => i.visible !== false)

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
        'overflow-hidden shrink-0',
        isCollapsed ? 'w-16' : 'w-60'
      )}
      aria-label="Secondary navigation"
    >
      {/* Top: collapse control — margin below matches IconRail toggle spacing (mb-4) */}
      <div
        className={cn(
          'shrink-0 flex border-b border-outline-variant',
          isCollapsed
            ? 'flex-col items-center pt-6 pb-4'
            : 'items-center justify-between px-3 pt-6 pb-4'
        )}
      >
        {!isCollapsed && (
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-title-lg text-on-background leading-tight truncate">
              {group?.title ?? 'Workspace'}
            </h2>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center rounded-lg text-on-surface-variant',
            'hover:bg-surface-container hover:text-on-surface',
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

      {/* Nav items — gap/padding parallel to primary rail items */}
      <div
        className={cn(
          'flex-1 overflow-y-auto scrollbar-hide',
          isCollapsed ? 'pt-2 flex flex-col items-center' : 'pt-2 px-1'
        )}
      >
        <ul
          className={cn(
            'flex flex-col gap-1',
            isCollapsed ? 'w-full items-center' : 'w-full'
          )}
        >
          {items.map((item) => {
            const active = isItemActive(item.to)
            return (
              <li key={item.id} className={isCollapsed ? 'w-full flex justify-center' : 'w-full'}>
                <Link
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center group relative',
                    // Match IconRail vertical padding (py-3.5)
                    isCollapsed
                      ? 'w-10 h-11 justify-center rounded-lg'
                      : 'w-full px-3 py-3.5 rounded-lg gap-3',
                    active
                      ? 'bg-surface-container-high text-on-surface font-medium'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined text-2xl shrink-0',
                      active ? 'text-electric-blue' : ''
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

                  {isCollapsed && item.badge != null && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-electric-blue" />
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
