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

interface SecondarySidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  railWidth: number
}

export function SecondarySidebar({
  isCollapsed,
  onToggle,
  railWidth,
}: SecondarySidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moduleId = getActiveModule(pathname)
  const group = SECONDARY_NAV[moduleId]
  const items = (group?.items ?? []).filter((i) => i.visible !== false)

  if (items.length === 0 && isCollapsed) {
    return null
  }

  return (
    <nav
      className={cn(
        'h-full bg-surface-container-lowest border-r border-outline-variant flex flex-col',
        'transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap relative shrink-0',
        isCollapsed ? 'w-0' : 'w-sidebar-secondary'
      )}
      aria-label="Secondary navigation"
    >
      {!isCollapsed && (
        <div className="w-[240px] flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-outline-variant shrink-0">
            <h2 className="text-headline-md text-on-background leading-tight">Bytevon CRM</h2>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">
              Workspace
            </p>
          </div>

          {/* Items */}
          <div className="flex-1 py-6 overflow-y-auto scrollbar-hide px-2">
            {group && (
              <>
                <h3 className="text-nav-group text-on-surface-variant/70 px-4 mb-2 uppercase">
                  {group.title}
                </h3>
                <ul className="flex flex-col gap-1">
                  {items.map((item) => {
                    const active =
                      pathname === item.to ||
                      (item.to !== '/projects' && pathname.startsWith(item.to))
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.to}
                          className={cn(
                            'flex items-center px-4 py-3 rounded-lg transition-all duration-200 group',
                            active
                              ? 'bg-surface-container-high text-on-surface font-medium'
                              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                          )}
                        >
                          <span
                            className={cn(
                              'material-symbols-outlined mr-3 text-lg transition-colors',
                              active ? 'text-electric-blue' : 'group-hover:text-electric-blue'
                            )}
                            style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {item.icon}
                          </span>
                          <span className="text-nav-item flex-1">{item.label}</span>
                          {item.badge != null && (
                            <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating toggle when needed */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'fixed top-6 z-[60] text-on-surface-variant hover:text-on-surface transition-all duration-300',
          'p-1 rounded hover:bg-surface-container'
        )}
        style={{ left: `${railWidth + (isCollapsed ? 16 : 200)}px` }}
        aria-label={isCollapsed ? 'Expand secondary sidebar' : 'Collapse secondary sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="material-symbols-outlined text-xl">
          {isCollapsed ? 'menu' : 'menu_open'}
        </span>
      </button>
    </nav>
  )
}